"""
DentalBI FastAPI 메인 서버 (v2)
- 모듈화된 라우터 구조
- CORS 설정 (credentials 지원)
- 인증 라우터 등록
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, admin, superadmin, ai, crm

# ═══════════════════════════════════════
# FastAPI 앱 생성
# ═══════════════════════════════════════
app = FastAPI(
    title="DentalBI API",
    description="치과 전자차트(MSSQL) 데이터를 AI로 분석하는 B2B SaaS 경영 대시보드 API",
    version="2.0.0",
)

# ─── CORS 설정 ───
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3100",
        "https://denbi.vercel.app",
    ],
    allow_credentials=True,  # JWT 쿠키 전송 허용
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── 라우터 등록 ───
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(superadmin.router)
app.include_router(ai.router)
app.include_router(crm.router)


# ═══════════════════════════════════════
# 헬스 체크
# ═══════════════════════════════════════
@app.get("/health")
async def health_check():
    """서버 상태 확인"""
    return {
        "status": "healthy",
        "service": "DentalBI API",
        "version": "2.0.0",
    }


# ─── 기존 backend_main.py의 엔드포인트들은
# ─── 추후 app/routers/dashboard.py 등으로 분리 예정
# ─── 현재는 인증 시스템만 구현


@app.on_event("startup")
async def startup_event():
    """서버 시작 시 PostgreSQL 연결 확인"""
    try:
        import psycopg2
        conn = psycopg2.connect(settings.database_url)
        conn.close()
        print("✅ PostgreSQL 연결 성공")
    except Exception as e:
        print(f"⚠️ PostgreSQL 연결 실패 (인증 기능 비활성화): {e}")
        print("   docker-compose up postgres 로 PostgreSQL을 시작하세요.")
