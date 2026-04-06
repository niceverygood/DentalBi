"""
DentalBI CRM 라우터
녹음 파일 업로드 → STT → AI 요약 → 통화 이력 관리
"""
import json
from datetime import datetime, date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
import psycopg2
import psycopg2.extras

from app.config import settings
from app.utils.deps import get_current_user
from app.models.schemas import (
    TokenData, CallRecordResponse, CallDetailResponse,
    CallUpdateRequest, CRMStatsResponse, MessageResponse,
)
from app.services.call_summary_service import transcribe_audio, summarize_call

router = APIRouter(prefix="/api/crm", tags=["CRM"])


# ═══════════════════════════════════════
# 헬퍼
# ═══════════════════════════════════════

def _get_db():
    """PostgreSQL 연결"""
    return psycopg2.connect(settings.database_url)


def _row_to_call(row: dict) -> dict:
    """DB row를 API 응답 형식으로 변환"""
    result = dict(row)
    if result.get("ai_summary") and isinstance(result["ai_summary"], str):
        result["ai_summary"] = json.loads(result["ai_summary"])
    for key in ("created_at", "updated_at", "scheduled_callback"):
        if result.get(key) and isinstance(result[key], datetime):
            result[key] = result[key].isoformat()
    return result


# ═══════════════════════════════════════
# 녹음 파일 업로드 (Android 앱에서 호출)
# ═══════════════════════════════════════

@router.post("/upload", response_model=CallRecordResponse)
async def upload_recording(
    file: UploadFile = File(...),
    patient_name: Optional[str] = Form(None),
    patient_hash: Optional[str] = Form(None),
    phone_number: Optional[str] = Form(None),
    direction: str = Form("outbound"),
    duration: int = Form(0),
    pending_tx: Optional[str] = Form(None),
    risk_score: Optional[float] = Form(None),
    current_user: TokenData = Depends(get_current_user),
):
    """
    녹음 파일 업로드 → Supabase 저장 → STT → AI 요약 → DB 저장

    Android 앱에서 통화 종료 후 자동 호출
    """
    audio_data = await file.read()

    # 1. Supabase Storage에 업로드
    recording_url = await _upload_to_supabase(
        audio_data, file.filename or "recording.m4a",
        current_user.clinic_id,
    )

    # 2. Whisper STT
    try:
        transcript = await transcribe_audio(audio_data, file.filename or "recording.m4a")
    except Exception as e:
        transcript = f"[STT 실패: {str(e)}]"

    # 3. AI 요약
    ai_summary = None
    if transcript and not transcript.startswith("[STT 실패"):
        try:
            patient_ctx = {}
            if patient_name:
                patient_ctx["name"] = patient_name
            if pending_tx:
                patient_ctx["pending_tx"] = pending_tx
            if risk_score is not None:
                patient_ctx["risk_score"] = risk_score
            ai_summary = await summarize_call(transcript, patient_ctx or None)
        except Exception:
            ai_summary = None

    # 4. DB 저장
    conn = _get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # 직원 이름 조회
            cur.execute("SELECT name FROM users WHERE id = %s", (current_user.user_id,))
            staff_row = cur.fetchone()
            staff_name = staff_row["name"] if staff_row else "Unknown"

            cur.execute("""
                INSERT INTO call_records (
                    clinic_id, patient_hash, patient_name, staff_user_id, staff_name,
                    phone_number, direction, status, duration, recording_url,
                    transcript, ai_summary, pending_tx, risk_score,
                    call_result
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                current_user.clinic_id,
                patient_hash,
                patient_name,
                current_user.user_id,
                staff_name,
                phone_number,
                direction,
                "completed",
                duration,
                recording_url,
                transcript,
                json.dumps(ai_summary, ensure_ascii=False) if ai_summary else None,
                pending_tx,
                risk_score,
                ai_summary.get("recommended_result") if ai_summary else None,
            ))
            row = cur.fetchone()
            conn.commit()
            return _row_to_call(row)
    finally:
        conn.close()


async def _upload_to_supabase(data: bytes, filename: str, clinic_id: int) -> Optional[str]:
    """Supabase Storage에 녹음 파일 업로드"""
    if not settings.supabase_url or not settings.supabase_key:
        return None

    import httpx
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = f"clinic_{clinic_id}/{timestamp}_{filename}"

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{settings.supabase_url}/storage/v1/object/{settings.supabase_bucket}/{path}",
            headers={
                "Authorization": f"Bearer {settings.supabase_key}",
                "apikey": settings.supabase_key,
                "Content-Type": "audio/mp4",
            },
            content=data,
        )
        if response.status_code in (200, 201):
            return f"{settings.supabase_url}/storage/v1/object/public/{settings.supabase_bucket}/{path}"
    return None


# ═══════════════════════════════════════
# 통화 이력 조회
# ═══════════════════════════════════════

@router.get("/calls")
async def list_calls(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    call_result: Optional[str] = Query(None),
    staff_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: TokenData = Depends(get_current_user),
):
    """통화 이력 목록 (페이지네이션, 필터)"""
    conn = _get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            conditions = ["clinic_id = %s"]
            params: list = [current_user.clinic_id]

            if call_result:
                conditions.append("call_result = %s")
                params.append(call_result)
            if staff_id:
                conditions.append("staff_user_id = %s")
                params.append(staff_id)
            if search:
                conditions.append("(patient_name ILIKE %s OR notes ILIKE %s)")
                params.extend([f"%{search}%", f"%{search}%"])
            if start_date:
                conditions.append("created_at >= %s")
                params.append(start_date)
            if end_date:
                conditions.append("created_at <= %s")
                params.append(end_date + " 23:59:59")

            where = " AND ".join(conditions)

            # 총 건수
            cur.execute(f"SELECT COUNT(*) as cnt FROM call_records WHERE {where}", params)
            total = cur.fetchone()["cnt"]

            # 페이지네이션 데이터
            offset = (page - 1) * limit
            cur.execute(f"""
                SELECT id, patient_name, staff_name, phone_number, direction,
                       status, duration, call_result, ai_summary, notes,
                       pending_tx, risk_score, scheduled_callback, created_at
                FROM call_records
                WHERE {where}
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
            """, params + [limit, offset])

            rows = cur.fetchall()
            return {
                "calls": [_row_to_call(r) for r in rows],
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": (total + limit - 1) // limit,
            }
    finally:
        conn.close()


@router.get("/calls/{call_id}", response_model=CallDetailResponse)
async def get_call_detail(
    call_id: int,
    current_user: TokenData = Depends(get_current_user),
):
    """통화 상세 조회 (전사 + 녹음 URL 포함)"""
    conn = _get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM call_records WHERE id = %s AND clinic_id = %s",
                (call_id, current_user.clinic_id),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="통화 기록을 찾을 수 없습니다")
            return _row_to_call(row)
    finally:
        conn.close()


@router.put("/calls/{call_id}", response_model=CallRecordResponse)
async def update_call(
    call_id: int,
    req: CallUpdateRequest,
    current_user: TokenData = Depends(get_current_user),
):
    """통화 기록 수정 (결과/메모/콜백)"""
    conn = _get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            updates = []
            params: list = []

            if req.call_result is not None:
                updates.append("call_result = %s")
                params.append(req.call_result)
            if req.notes is not None:
                updates.append("notes = %s")
                params.append(req.notes)
            if req.scheduled_callback is not None:
                updates.append("scheduled_callback = %s")
                params.append(req.scheduled_callback)

            if not updates:
                raise HTTPException(status_code=400, detail="수정할 내용이 없습니다")

            updates.append("updated_at = NOW()")
            set_clause = ", ".join(updates)
            params.extend([call_id, current_user.clinic_id])

            cur.execute(
                f"UPDATE call_records SET {set_clause} WHERE id = %s AND clinic_id = %s RETURNING *",
                params,
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="통화 기록을 찾을 수 없습니다")
            conn.commit()
            return _row_to_call(row)
    finally:
        conn.close()


@router.post("/calls/{call_id}/resummarize", response_model=CallDetailResponse)
async def resummarize_call(
    call_id: int,
    current_user: TokenData = Depends(get_current_user),
):
    """AI 요약 재생성"""
    conn = _get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM call_records WHERE id = %s AND clinic_id = %s",
                (call_id, current_user.clinic_id),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="통화 기록을 찾을 수 없습니다")

            if not row.get("transcript"):
                raise HTTPException(status_code=400, detail="전사 내용이 없어 요약할 수 없습니다")

            patient_ctx = {}
            if row.get("patient_name"):
                patient_ctx["name"] = row["patient_name"]
            if row.get("pending_tx"):
                patient_ctx["pending_tx"] = row["pending_tx"]
            if row.get("risk_score") is not None:
                patient_ctx["risk_score"] = row["risk_score"]

            ai_summary = await summarize_call(row["transcript"], patient_ctx or None)

            cur.execute(
                """UPDATE call_records
                   SET ai_summary = %s, call_result = %s, updated_at = NOW()
                   WHERE id = %s RETURNING *""",
                (
                    json.dumps(ai_summary, ensure_ascii=False),
                    ai_summary.get("recommended_result"),
                    call_id,
                ),
            )
            updated = cur.fetchone()
            conn.commit()
            return _row_to_call(updated)
    finally:
        conn.close()


# ═══════════════════════════════════════
# CRM 통계
# ═══════════════════════════════════════

@router.get("/stats", response_model=CRMStatsResponse)
async def get_crm_stats(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: TokenData = Depends(get_current_user),
):
    """CRM KPI 통계"""
    conn = _get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            clinic_id = current_user.clinic_id

            # 오늘 통화 수
            cur.execute(
                "SELECT COUNT(*) as cnt FROM call_records WHERE clinic_id = %s AND created_at::date = CURRENT_DATE",
                (clinic_id,),
            )
            total_today = cur.fetchone()["cnt"]

            # 기간 내 통화
            period_conditions = ["clinic_id = %s"]
            period_params: list = [clinic_id]
            if start_date:
                period_conditions.append("created_at >= %s")
                period_params.append(start_date)
            if end_date:
                period_conditions.append("created_at <= %s")
                period_params.append(end_date + " 23:59:59")
            period_where = " AND ".join(period_conditions)

            cur.execute(f"SELECT COUNT(*) as cnt FROM call_records WHERE {period_where}", period_params)
            total_period = cur.fetchone()["cnt"]

            # 컨택률 (부재중 제외 비율)
            cur.execute(
                f"SELECT COUNT(*) as cnt FROM call_records WHERE {period_where} AND call_result != 'no_answer'",
                period_params,
            )
            contacted = cur.fetchone()["cnt"]
            contact_rate = round((contacted / total_period * 100), 1) if total_period > 0 else 0

            # 콜백 예정
            cur.execute(
                "SELECT COUNT(*) as cnt FROM call_records WHERE clinic_id = %s AND call_result = 'callback' AND scheduled_callback > NOW()",
                (clinic_id,),
            )
            callbacks = cur.fetchone()["cnt"]

            # 예약 성공
            cur.execute(
                f"SELECT COUNT(*) as cnt FROM call_records WHERE {period_where} AND call_result = 'appointment'",
                period_params,
            )
            appointments = cur.fetchone()["cnt"]

            # 평균 통화 시간
            cur.execute(
                f"SELECT COALESCE(AVG(duration), 0) as avg_dur FROM call_records WHERE {period_where} AND duration > 0",
                period_params,
            )
            avg_dur = int(cur.fetchone()["avg_dur"])

            return CRMStatsResponse(
                total_calls_today=total_today,
                contact_rate=contact_rate,
                callbacks_scheduled=callbacks,
                successful_recalls=appointments,
                total_calls_period=total_period,
                avg_duration=avg_dur,
            )
    finally:
        conn.close()
