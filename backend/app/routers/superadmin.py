"""
DentalBI 총괄관리자(SuperAdmin) 라우터
플랫폼 전체 치과/계정/구독 관리
superadmin 역할만 접근 가능
총괄관리자 계정: hss@bottlecorp.kr
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import psycopg2
import psycopg2.extras

from app.config import settings
from app.models.schemas import TokenData, MessageResponse
from app.utils.deps import require_superadmin
from app.utils.security import hash_password


router = APIRouter(prefix="/api/superadmin", tags=["총괄관리자"])


def get_pg_conn():
    """PostgreSQL 연결 획득"""
    return psycopg2.connect(settings.database_url)


# ═══════════════════════════════════════
# 스키마
# ═══════════════════════════════════════

class PlatformStats(BaseModel):
    """플랫폼 전체 통계"""
    total_clinics: int
    total_users: int
    active_users: int
    total_doctors: int
    plan_free: int
    plan_basic: int
    plan_professional: int
    plan_enterprise: int


class ClinicDetail(BaseModel):
    """치과 상세 정보 (총괄관리자용)"""
    id: int
    name: str
    ehr_type: str
    address: Optional[str]
    phone: Optional[str]
    chair_count: int
    plan: str                    # free | basic | professional | enterprise
    plan_expires: Optional[str]
    total_staff: int
    active_doctors: int
    owner_name: Optional[str]
    owner_email: Optional[str]
    created_at: Optional[str]
    is_active: bool


class ClinicPlanUpdate(BaseModel):
    """치과 구독 플랜 변경"""
    plan: str                    # free | basic | professional | enterprise
    plan_expires: Optional[str]  # YYYY-MM-DD


class UserDetail(BaseModel):
    """사용자 상세 (총괄관리자용)"""
    id: int
    email: str
    name: str
    role: str
    position: Optional[str]
    clinic_id: int
    clinic_name: str
    is_active: bool
    is_doctor: bool
    created_at: Optional[str]
    last_login: Optional[str]


class UserRoleUpdate(BaseModel):
    """사용자 역할 변경 (총괄관리자)"""
    role: str  # superadmin | owner | admin | viewer


# ═══════════════════════════════════════
# 플랫폼 통계
# ═══════════════════════════════════════

@router.get("/stats", response_model=PlatformStats)
async def get_platform_stats(
    current_user: TokenData = Depends(require_superadmin),
):
    """플랫폼 전체 통계 조회"""
    conn = get_pg_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT COUNT(*) as cnt FROM clinics")
            total_clinics = cur.fetchone()["cnt"]

            cur.execute("SELECT COUNT(*) as cnt FROM users")
            total_users = cur.fetchone()["cnt"]

            cur.execute("SELECT COUNT(*) as cnt FROM users WHERE COALESCE(is_active, true) = true")
            active_users = cur.fetchone()["cnt"]

            cur.execute("SELECT COUNT(*) as cnt FROM users WHERE COALESCE(is_doctor, true) = true")
            total_doctors = cur.fetchone()["cnt"]

            # 플랜별 치과 수
            plans = {"free": 0, "basic": 0, "professional": 0, "enterprise": 0}
            cur.execute("SELECT COALESCE(plan, 'free') as plan, COUNT(*) as cnt FROM clinics GROUP BY COALESCE(plan, 'free')")
            for row in cur.fetchall():
                if row["plan"] in plans:
                    plans[row["plan"]] = row["cnt"]

            return PlatformStats(
                total_clinics=total_clinics,
                total_users=total_users,
                active_users=active_users,
                total_doctors=total_doctors,
                plan_free=plans["free"],
                plan_basic=plans["basic"],
                plan_professional=plans["professional"],
                plan_enterprise=plans["enterprise"],
            )
    finally:
        conn.close()


# ═══════════════════════════════════════
# 전체 치과 관리
# ═══════════════════════════════════════

@router.get("/clinics", response_model=list[ClinicDetail])
async def list_all_clinics(
    current_user: TokenData = Depends(require_superadmin),
):
    """전체 치과 목록 조회"""
    conn = get_pg_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("""
                SELECT c.id, c.name,
                       COALESCE(c.ehr_type, 'hanaro') as ehr_type,
                       c.address, c.phone,
                       COALESCE(c.chair_count, 5) as chair_count,
                       COALESCE(c.plan, 'free') as plan,
                       c.plan_expires::text,
                       COALESCE(c.is_active, true) as is_active,
                       c.created_at::text,
                       (SELECT COUNT(*) FROM users WHERE clinic_id = c.id) as total_staff,
                       (SELECT COUNT(*) FROM users WHERE clinic_id = c.id
                        AND COALESCE(is_doctor, true) = true
                        AND COALESCE(is_active, true) = true) as active_doctors,
                       (SELECT name FROM users WHERE clinic_id = c.id AND role = 'owner' LIMIT 1) as owner_name,
                       (SELECT email FROM users WHERE clinic_id = c.id AND role = 'owner' LIMIT 1) as owner_email
                FROM clinics c
                ORDER BY c.id
            """)
            return [ClinicDetail(**row) for row in cur.fetchall()]
    finally:
        conn.close()


@router.put("/clinics/{clinic_id}/plan", response_model=MessageResponse)
async def update_clinic_plan(
    clinic_id: int,
    data: ClinicPlanUpdate,
    current_user: TokenData = Depends(require_superadmin),
):
    """치과 구독 플랜 변경"""
    valid_plans = ("free", "basic", "professional", "enterprise")
    if data.plan not in valid_plans:
        raise HTTPException(status_code=400, detail=f"유효하지 않은 플랜: {data.plan}")

    conn = get_pg_conn()
    try:
        with conn.cursor() as cur:
            if data.plan_expires:
                cur.execute(
                    "UPDATE clinics SET plan = %s, plan_expires = %s WHERE id = %s",
                    (data.plan, data.plan_expires, clinic_id),
                )
            else:
                cur.execute(
                    "UPDATE clinics SET plan = %s WHERE id = %s",
                    (data.plan, clinic_id),
                )
            conn.commit()
            return MessageResponse(message=f"치과 #{clinic_id} 플랜이 '{data.plan}'으로 변경되었습니다")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"플랜 변경 실패: {str(e)}")
    finally:
        conn.close()


@router.put("/clinics/{clinic_id}/toggle-active", response_model=MessageResponse)
async def toggle_clinic_active(
    clinic_id: int,
    current_user: TokenData = Depends(require_superadmin),
):
    """치과 활성/비활성 토글"""
    conn = get_pg_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT COALESCE(is_active, true) as is_active FROM clinics WHERE id = %s", (clinic_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="치과를 찾을 수 없습니다")

            new_val = not row["is_active"]
            cur.execute("UPDATE clinics SET is_active = %s WHERE id = %s", (new_val, clinic_id))
            conn.commit()
            status_str = "활성화" if new_val else "비활성화"
            return MessageResponse(message=f"치과 #{clinic_id}가 {status_str}되었습니다")
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# ═══════════════════════════════════════
# 전체 사용자 관리
# ═══════════════════════════════════════

@router.get("/users", response_model=list[UserDetail])
async def list_all_users(
    current_user: TokenData = Depends(require_superadmin),
):
    """전체 사용자 목록 조회 (모든 치과)"""
    conn = get_pg_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("""
                SELECT u.id, u.email, u.name, u.role,
                       COALESCE(u.position, '진료원장') as position,
                       u.clinic_id, c.name as clinic_name,
                       COALESCE(u.is_active, true) as is_active,
                       COALESCE(u.is_doctor, true) as is_doctor,
                       u.created_at::text, u.last_login::text
                FROM users u
                JOIN clinics c ON u.clinic_id = c.id
                ORDER BY u.id
            """)
            return [UserDetail(**row) for row in cur.fetchall()]
    finally:
        conn.close()


@router.put("/users/{user_id}/role", response_model=MessageResponse)
async def update_user_role(
    user_id: int,
    data: UserRoleUpdate,
    current_user: TokenData = Depends(require_superadmin),
):
    """사용자 역할 변경 (총괄관리자만)"""
    valid_roles = ("superadmin", "owner", "admin", "viewer")
    if data.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"유효하지 않은 역할: {data.role}")

    conn = get_pg_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE users SET role = %s WHERE id = %s", (data.role, user_id))
            conn.commit()
            return MessageResponse(message=f"사용자 #{user_id} 역할이 '{data.role}'로 변경되었습니다")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.put("/users/{user_id}/toggle-active", response_model=MessageResponse)
async def toggle_user_active(
    user_id: int,
    current_user: TokenData = Depends(require_superadmin),
):
    """사용자 활성/비활성 토글"""
    conn = get_pg_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT COALESCE(is_active, true) as is_active FROM users WHERE id = %s", (user_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")

            new_val = not row["is_active"]
            cur.execute("UPDATE users SET is_active = %s WHERE id = %s", (new_val, user_id))
            conn.commit()
            return MessageResponse(message=f"사용자 #{user_id} {'활성화' if new_val else '비활성화'}")
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.post("/users/{user_id}/reset-password", response_model=MessageResponse)
async def reset_user_password(
    user_id: int,
    current_user: TokenData = Depends(require_superadmin),
):
    """사용자 비밀번호 초기화 (임시: dentalbi1234)"""
    conn = get_pg_conn()
    try:
        with conn.cursor() as cur:
            hashed = hash_password("dentalbi1234")
            cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (hashed, user_id))
            conn.commit()
            return MessageResponse(message="비밀번호가 'dentalbi1234'로 초기화되었습니다")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
