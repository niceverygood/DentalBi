"""
DentalBI 인증 라우터
회원가입, 로그인, 토큰 갱신, 사용자 정보, 로그아웃
"""
from fastapi import APIRouter, HTTPException, status, Response, Request
import psycopg2
import psycopg2.extras

from app.config import settings
from app.models.schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse, MessageResponse,
)
from app.utils.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
)

router = APIRouter(prefix="/api/auth", tags=["인증"])


def get_pg_conn():
    """PostgreSQL 연결 획득"""
    return psycopg2.connect(settings.database_url)


@router.post("/register", response_model=TokenResponse)
async def register(data: UserCreate, response: Response):
    """
    회원가입
    - 첫 번째 사용자는 자동으로 owner 역할
    - clinic이 없으면 clinics 테이블에 자동 생성
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

            # 치과 생성 (또는 기존 치과 확인)
            cur.execute(
                "INSERT INTO clinics (name, ehr_type) VALUES (%s, %s) RETURNING id",
                (data.clinic_name, data.chart_type),
            )
            clinic = cur.fetchone()
            clinic_id = clinic["id"]

            # 기존 사용자 수 확인 → 첫 사용자 = owner
            cur.execute("SELECT COUNT(*) as cnt FROM users WHERE clinic_id = %s", (clinic_id,))
            count = cur.fetchone()["cnt"]
            role = "owner" if count == 0 else "viewer"

            # 사용자 생성
            hashed = hash_password(data.password)
            cur.execute(
                """INSERT INTO users (clinic_id, email, password_hash, name, role)
                   VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                (clinic_id, data.email, hashed, data.name, role),
            )
            user = cur.fetchone()
            conn.commit()

            # 토큰 생성
            token_data = {"user_id": user["id"], "clinic_id": clinic_id, "role": role}
            access_token = create_access_token(token_data)
            refresh_token = create_refresh_token(token_data)

            # 리프레시 토큰을 httpOnly 쿠키에 설정
            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=False,  # 프로덕션에서는 True
                samesite="lax",
                max_age=7 * 24 * 60 * 60,  # 7일
            )

            return TokenResponse(
                access_token=access_token,
                user=UserResponse(
                    id=user["id"],
                    email=data.email,
                    name=data.name,
                    role=role,
                    clinic_id=clinic_id,
                    clinic_name=data.clinic_name,
                ),
            )
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"회원가입 실패: {str(e)}")
    finally:
        conn.close()


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, response: Response):
    """
    로그인
    - access_token (30분) + refresh_token (7일, httpOnly 쿠키)
    """
    conn = get_pg_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """SELECT u.id, u.email, u.name, u.role, u.password_hash,
                          u.clinic_id, c.name as clinic_name
                   FROM users u JOIN clinics c ON u.clinic_id = c.id
                   WHERE u.email = %s""",
                (data.email,),
            )
            user = cur.fetchone()

            if not user or not verify_password(data.password, user["password_hash"]):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="이메일 또는 비밀번호가 올바르지 않습니다",
                )

            # 마지막 로그인 시간 업데이트
            cur.execute("UPDATE users SET last_login = NOW() WHERE id = %s", (user["id"],))
            conn.commit()

            # 토큰 생성
            token_data = {"user_id": user["id"], "clinic_id": user["clinic_id"], "role": user["role"]}
            access_token = create_access_token(token_data)
            refresh_token = create_refresh_token(token_data)

            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=False,
                samesite="lax",
                max_age=7 * 24 * 60 * 60,
            )

            return TokenResponse(
                access_token=access_token,
                user=UserResponse(
                    id=user["id"],
                    email=user["email"],
                    name=user["name"],
                    role=user["role"],
                    clinic_id=user["clinic_id"],
                    clinic_name=user["clinic_name"],
                ),
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"로그인 실패: {str(e)}")
    finally:
        conn.close()


@router.post("/refresh", response_model=dict)
async def refresh_token(request: Request, response: Response):
    """
    토큰 갱신
    - 쿠키의 refresh_token을 검증하여 새 access_token 발급
    """
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="리프레시 토큰이 없습니다")

    token_data = decode_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="유효하지 않은 리프레시 토큰입니다")

    # 새 액세스 토큰 발급
    new_access = create_access_token({
        "user_id": token_data.user_id,
        "clinic_id": token_data.clinic_id,
        "role": token_data.role,
    })

    return {"access_token": new_access, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(request: Request):
    """
    현재 로그인된 사용자 정보 반환
    Authorization: Bearer {access_token} 필요
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="인증이 필요합니다")

    token = auth_header.split(" ")[1]
    token_data = decode_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다")

    conn = get_pg_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """SELECT u.id, u.email, u.name, u.role, u.clinic_id, c.name as clinic_name
                   FROM users u JOIN clinics c ON u.clinic_id = c.id
                   WHERE u.id = %s""",
                (token_data.user_id,),
            )
            user = cur.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")

            return UserResponse(**user)
    finally:
        conn.close()


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response):
    """로그아웃 — refresh_token 쿠키 삭제"""
    response.delete_cookie("refresh_token")
    return MessageResponse(message="로그아웃되었습니다")
