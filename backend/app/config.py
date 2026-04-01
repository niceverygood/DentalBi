"""
DentalBI 설정 관리
pydantic-settings 기반 환경변수 로딩
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """애플리케이션 전체 설정 — .env 파일에서 자동 로딩"""

    # ─── MSSQL (치과 전자차트 DB) ───
    mssql_host: str = "localhost"
    mssql_port: int = 1433
    mssql_database: str = "hanaro"
    mssql_user: str = "dentalbi_reader"
    mssql_password: str = ""
    chart_type: str = "hanaro"  # hanaro | dentweb | oneclick

    # ─── PostgreSQL (SaaS 메타데이터) ───
    database_url: str = "postgresql://dentalbi:dentalbi@localhost:5432/dentalbi"

    # ─── JWT 인증 ───
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # ─── AI 분석 (OpenRouter API) ───
    openrouter_api_key: str = ""
    claude_api_key: str = ""  # 하위 호환

    # ─── Redis ───
    redis_url: str = "redis://localhost:6379"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# 싱글톤 인스턴스
settings = Settings()
