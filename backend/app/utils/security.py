"""
DentalBI 보안 유틸리티
비밀번호 해싱 (bcrypt) + JWT 토큰 생성/검증
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings
from app.models.schemas import TokenData

# bcrypt 해싱 컨텍스트
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """비밀번호를 bcrypt 해시로 변환"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """평문 비밀번호와 해시 비교"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    JWT 액세스 토큰 생성
    기본 만료: 30분
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(data: dict) -> str:
    """
    JWT 리프레시 토큰 생성
    기본 만료: 7일
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> Optional[TokenData]:
    """
    JWT 토큰 디코딩 → TokenData 반환
    토큰이 유효하지 않으면 None 반환
    """
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id: int = payload.get("user_id")  # type: ignore
        clinic_id: int = payload.get("clinic_id")  # type: ignore
        role: str = payload.get("role", "viewer")  # type: ignore
        if user_id is None:
            return None
        return TokenData(user_id=user_id, clinic_id=clinic_id, role=role)
    except JWTError:
        return None
