"""
DentalBI Pydantic 스키마 (요청/응답 모델)
인증, 사용자, DB 연결 관련 데이터 모델 정의
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ═══════════════════════════════════════
# 인증 관련 스키마
# ═══════════════════════════════════════

class UserCreate(BaseModel):
    """회원가입 요청"""
    email: str
    password: str
    name: str
    clinic_name: str
    chart_type: str = "hanaro"  # 전자차트 종류


class UserLogin(BaseModel):
    """로그인 요청"""
    email: str
    password: str


class UserResponse(BaseModel):
    """사용자 정보 응답"""
    id: int
    email: str
    name: str
    role: str  # superadmin | owner | admin | viewer
    clinic_id: int
    clinic_name: Optional[str] = None


class TokenResponse(BaseModel):
    """토큰 응답"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """JWT 페이로드 디코딩 결과"""
    user_id: int
    clinic_id: int
    role: str


# ═══════════════════════════════════════
# DB 연결 테스트 스키마
# ═══════════════════════════════════════

class DBConnectionTest(BaseModel):
    """DB 연결 테스트 요청"""
    host: str
    port: int = 1433
    database: str
    user: str
    password: str
    chart_type: str = "hanaro"


class DBConnectionResult(BaseModel):
    """DB 연결 테스트 결과"""
    connected: bool
    version: Optional[str] = None
    tables_found: int = 0
    tables_missing: list[str] = []
    ready: bool = False
    error: Optional[str] = None


# ═══════════════════════════════════════
# API 공통 응답
# ═══════════════════════════════════════

class MessageResponse(BaseModel):
    """일반 메시지 응답"""
    message: str
    success: bool = True
