"""
DentalBI 관리자 라우터
직원(의사/스태프) 등록, 수정, 비활성화, 역할 변경
owner/admin 권한 필요
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional
import psycopg2
import psycopg2.extras

from app.config import settings
from app.models.schemas import TokenData, MessageResponse
from app.utils.deps import get_current_user, require_admin
from app.utils.security import hash_password


router = APIRouter(prefix="/api/admin", tags=["관리자"])


def get_pg_conn():
    """PostgreSQL 연결 획득"""
    return psycopg2.connect(settings.database_url)


# ═══════════════════════════════════════
# 스키마 (요청/응답)
# ═══════════════════════════════════════

class StaffCreate(BaseModel):
    """직원 등록 요청"""
    name: str
    email: str
    password: str
    role: str = "viewer"                    # owner | admin | viewer
    position: str = "진료원장"              # 대표원장 | 부원장 | 진료원장 | 봉직의 | 스태프
    specialty: Optional[str] = None         # 보철과 | 교정과 | 구강외과 등
    phone: Optional[str] = None
    is_doctor: bool = True                  # 의사 여부 (비의사 스태프 구분)
    license_number: Optional[str] = None    # 의사 면허번호


class StaffUpdate(BaseModel):
    """직원 정보 수정 요청"""
    name: Optional[str] = None
    role: Optional[str] = None
    position: Optional[str] = None
    specialty: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    is_doctor: Optional[bool] = None
    license_number: Optional[str] = None


class StaffResponse(BaseModel):
    """직원 정보 응답"""
    id: int
    email: str
    name: str
    role: str
    position: str
    specialty: Optional[str]
    phone: Optional[str]
    is_doctor: bool
    is_active: bool
    license_number: Optional[str]
    clinic_id: int
    created_at: Optional[str]
    last_login: Optional[str]


class ClinicUpdate(BaseModel):
    """병원 정보 수정 요청"""
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    ehr_type: Optional[str] = None
    chair_count: Optional[int] = None


class ClinicResponse(BaseModel):
    """병원 정보 응답"""
    id: int
    name: str
    ehr_type: str
    address: Optional[str]
    phone: Optional[str]
    chair_count: int
    total_staff: int
    active_doctors: int
    created_at: Optional[str]


# ═══════════════════════════════════════
# 직원 관리 엔드포인트
# ═══════════════════════════════════════

@router.get("/staff", response_model=list[StaffResponse])
async def list_staff(
    current_user: TokenData = Depends(get_current_user),
):
    """
    같은 병원의 전체 직원 목록 조회
    - 모든 인증된 사용자 접근 가능 (자기 병원만)
    """
    conn = get_pg_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """SELECT id, email, name, role,
                          COALESCE(position, '진료원장') as position,
                          specialty, phone, 
                          COALESCE(is_doctor, true) as is_doctor,
                          COALESCE(is_active, true) as is_active,
                          license_number, clinic_id,
                          created_at::text, last_login::text
                   FROM users
                   WHERE clinic_id = %s
                   ORDER BY 
                     CASE role 
                       WHEN 'owner' THEN 1 
                       WHEN 'admin' THEN 2 
                       ELSE 3 
                     END,
                     name""",
                (current_user.clinic_id,),
            )
            rows = cur.fetchall()
            return [StaffResponse(**row) for row in rows]
    finally:
        conn.close()


@router.post("/staff", response_model=StaffResponse)
async def create_staff(
    data: StaffCreate,
    current_user: TokenData = Depends(require_admin),
):
    """
    새 직원(의사/스태프) 등록
    - admin 이상 권한 필요
    - 같은 병원에만 추가 가능
    """
    conn = get_pg_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # 이메일 중복 확인
            cur.execute("SELECT id FROM users WHERE email = %s", (data.email,))
            if cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="이미 등록된 이메일입니다",
                )

            # owner 역할 부여는 기존 owner만 가능
            if data.role == "owner" and current_user.role != "owner":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Owner 역할은 기존 Owner만 부여할 수 있습니다",
                )

            hashed = hash_password(data.password)
            cur.execute(
                """INSERT INTO users 
                   (clinic_id, email, password_hash, name, role, position, 
                    specialty, phone, is_doctor, is_active, license_number)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, true, %s)
                   RETURNING id, email, name, role, 
                     position, specialty, phone, is_doctor, 
                     is_active, license_number, clinic_id,
                     created_at::text, last_login::text""",
                (
                    current_user.clinic_id, data.email, hashed, data.name,
                    data.role, data.position, data.specialty, data.phone,
                    data.is_doctor, data.license_number,
                ),
            )
            user = cur.fetchone()
            conn.commit()
            return StaffResponse(**user)
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"직원 등록 실패: {str(e)}")
    finally:
        conn.close()


@router.put("/staff/{staff_id}", response_model=StaffResponse)
async def update_staff(
    staff_id: int,
    data: StaffUpdate,
    current_user: TokenData = Depends(require_admin),
):
    """
    직원 정보 수정
    - admin 이상 권한 필요
    - owner 역할 변경은 현재 owner만 가능
    """
    conn = get_pg_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # 대상 사용자 확인 (같은 병원인지 검증)
            cur.execute(
                "SELECT id, role, clinic_id FROM users WHERE id = %s",
                (staff_id,),
            )
            target = cur.fetchone()
            if not target:
                raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
            if target["clinic_id"] != current_user.clinic_id:
                raise HTTPException(status_code=403, detail="다른 병원의 직원은 수정할 수 없습니다")

            # owner → 다른 역할로 변경하는 것은 본인(owner)만 가능
            if target["role"] == "owner" and current_user.role != "owner":
                raise HTTPException(status_code=403, detail="Owner 계정은 Owner만 수정할 수 있습니다")

            # role을 owner로 변경하는 것은 현재 owner만 가능
            if data.role == "owner" and current_user.role != "owner":
                raise HTTPException(status_code=403, detail="Owner 역할은 기존 Owner만 부여할 수 있습니다")

            # 동적 UPDATE 쿼리 생성 — 전달된 필드만 업데이트
            updates = []
            values = []
            field_map = data.model_dump(exclude_none=True)
            for key, val in field_map.items():
                updates.append(f"{key} = %s")
                values.append(val)

            if not updates:
                raise HTTPException(status_code=400, detail="수정할 항목이 없습니다")

            values.append(staff_id)
            cur.execute(
                f"""UPDATE users SET {', '.join(updates)}
                    WHERE id = %s
                    RETURNING id, email, name, role,
                      COALESCE(position, '진료원장') as position,
                      specialty, phone, 
                      COALESCE(is_doctor, true) as is_doctor,
                      COALESCE(is_active, true) as is_active,
                      license_number, clinic_id,
                      created_at::text, last_login::text""",
                values,
            )
            user = cur.fetchone()
            conn.commit()
            return StaffResponse(**user)
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"직원 수정 실패: {str(e)}")
    finally:
        conn.close()


@router.delete("/staff/{staff_id}", response_model=MessageResponse)
async def deactivate_staff(
    staff_id: int,
    current_user: TokenData = Depends(require_admin),
):
    """
    직원 비활성화 (소프트 삭제)
    - 실제 삭제하지 않고 is_active = false 처리
    - owner 계정은 비활성화 불가
    """
    conn = get_pg_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id, role, clinic_id FROM users WHERE id = %s",
                (staff_id,),
            )
            target = cur.fetchone()
            if not target:
                raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
            if target["clinic_id"] != current_user.clinic_id:
                raise HTTPException(status_code=403, detail="다른 병원의 직원은 관리할 수 없습니다")
            if target["role"] == "owner":
                raise HTTPException(status_code=403, detail="Owner 계정은 비활성화할 수 없습니다")
            if target["id"] == current_user.user_id:
                raise HTTPException(status_code=400, detail="자신의 계정은 비활성화할 수 없습니다")

            cur.execute("UPDATE users SET is_active = false WHERE id = %s", (staff_id,))
            conn.commit()
            return MessageResponse(message="직원이 비활성화되었습니다")
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"직원 비활성화 실패: {str(e)}")
    finally:
        conn.close()


@router.post("/staff/{staff_id}/reactivate", response_model=MessageResponse)
async def reactivate_staff(
    staff_id: int,
    current_user: TokenData = Depends(require_admin),
):
    """
    비활성화된 직원 재활성화
    """
    conn = get_pg_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id, clinic_id FROM users WHERE id = %s",
                (staff_id,),
            )
            target = cur.fetchone()
            if not target:
                raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
            if target["clinic_id"] != current_user.clinic_id:
                raise HTTPException(status_code=403, detail="다른 병원의 직원은 관리할 수 없습니다")

            cur.execute("UPDATE users SET is_active = true WHERE id = %s", (staff_id,))
            conn.commit()
            return MessageResponse(message="직원이 재활성화되었습니다")
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"직원 재활성화 실패: {str(e)}")
    finally:
        conn.close()


@router.post("/staff/{staff_id}/reset-password", response_model=MessageResponse)
async def reset_staff_password(
    staff_id: int,
    current_user: TokenData = Depends(require_admin),
):
    """
    직원 비밀번호 초기화 (임시 비밀번호: dentalbi1234)
    """
    conn = get_pg_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id, clinic_id FROM users WHERE id = %s",
                (staff_id,),
            )
            target = cur.fetchone()
            if not target:
                raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
            if target["clinic_id"] != current_user.clinic_id:
                raise HTTPException(status_code=403, detail="다른 병원의 직원은 관리할 수 없습니다")

            hashed = hash_password("dentalbi1234")
            cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (hashed, staff_id))
            conn.commit()
            return MessageResponse(message="비밀번호가 'dentalbi1234'로 초기화되었습니다")
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"비밀번호 초기화 실패: {str(e)}")
    finally:
        conn.close()


# ═══════════════════════════════════════
# 병원 관리 엔드포인트
# ═══════════════════════════════════════

@router.get("/clinic", response_model=ClinicResponse)
async def get_clinic_info(
    current_user: TokenData = Depends(get_current_user),
):
    """현재 사용자 병원 정보 조회"""
    conn = get_pg_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """SELECT c.id, c.name, 
                          COALESCE(c.ehr_type, 'hanaro') as ehr_type,
                          c.address, c.phone,
                          COALESCE(c.chair_count, 5) as chair_count,
                          c.created_at::text,
                          (SELECT COUNT(*) FROM users WHERE clinic_id = c.id) as total_staff,
                          (SELECT COUNT(*) FROM users WHERE clinic_id = c.id 
                           AND COALESCE(is_doctor, true) = true 
                           AND COALESCE(is_active, true) = true) as active_doctors
                   FROM clinics c
                   WHERE c.id = %s""",
                (current_user.clinic_id,),
            )
            clinic = cur.fetchone()
            if not clinic:
                raise HTTPException(status_code=404, detail="병원 정보를 찾을 수 없습니다")
            return ClinicResponse(**clinic)
    finally:
        conn.close()


@router.put("/clinic", response_model=ClinicResponse)
async def update_clinic(
    data: ClinicUpdate,
    current_user: TokenData = Depends(require_admin),
):
    """
    병원 정보 수정
    - admin 이상 권한 필요
    """
    conn = get_pg_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            updates = []
            values = []
            field_map = data.model_dump(exclude_none=True)
            for key, val in field_map.items():
                updates.append(f"{key} = %s")
                values.append(val)

            if not updates:
                raise HTTPException(status_code=400, detail="수정할 항목이 없습니다")

            values.append(current_user.clinic_id)
            cur.execute(
                f"UPDATE clinics SET {', '.join(updates)} WHERE id = %s",
                values,
            )
            conn.commit()

            # 업데이트된 정보 반환
            return await get_clinic_info(current_user)
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"병원 정보 수정 실패: {str(e)}")
    finally:
        conn.close()
