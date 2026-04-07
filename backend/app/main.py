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
from app.routers import dashboard, doctors, patients, revenue, connection

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
    allow_origins=["http://localhost:3000", "http://localhost:3100"],
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

# ─── 대시보드 (MSSQL 연동) 라우터 ───
app.include_router(dashboard.router)
app.include_router(doctors.router)
app.include_router(patients.router)
app.include_router(revenue.router)
app.include_router(connection.router)


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


# ─── MSSQL 대시보드 엔드포인트 구현 완료
# ─── 다중 전자차트 어댑터: hanaro, dentweb, oneclick


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
