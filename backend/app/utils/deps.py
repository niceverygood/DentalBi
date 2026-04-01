"""
DentalBI FastAPI 의존성 주입
JWT 인증 + 역할 기반 접근 제어
superadmin: 플랫폼 총괄관리자 (모든 치과 관리 가능)
owner: 병원 관리자
admin: 직원 관리 + 데이터 접근
viewer: 데이터 열람만
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.utils.security import decode_token
from app.models.schemas import TokenData

# Bearer 토큰 추출기
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> TokenData:
    """
    Authorization: Bearer {token} 헤더에서 JWT 디코딩
    유효하지 않으면 401 Unauthorized 반환
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증이 필요합니다",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_data = decode_token(credentials.credentials)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 인증 토큰입니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token_data


async def require_superadmin(
    current_user: TokenData = Depends(get_current_user),
) -> TokenData:
    """superadmin(총괄관리자) 역할만 허용"""
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="총괄관리자 권한이 필요합니다",
        )
    return current_user


async def require_owner(
    current_user: TokenData = Depends(get_current_user),
) -> TokenData:
    """owner 또는 superadmin 역할만 허용"""
    if current_user.role not in ("superadmin", "owner"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner 권한이 필요합니다",
        )
    return current_user


async def require_admin(
    current_user: TokenData = Depends(get_current_user),
) -> TokenData:
    """owner, admin, 또는 superadmin 역할만 허용"""
    if current_user.role not in ("superadmin", "owner", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin 이상 권한이 필요합니다",
        )
    return current_user
