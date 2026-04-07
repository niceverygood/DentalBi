"""
DB 연결 관리 API 라우터
/api/connection/* — 연결 테스트, 연결 정보 저장
"""
import logging

import psycopg2
from fastapi import APIRouter, Depends, HTTPException

from app.config import settings
from app.utils.deps import get_current_user, require_owner
from app.models.schemas import TokenData, DBConnectionTest, DBConnectionResult
from app.database import MSSQLConnection
from app.queries import get_chart_adapter, list_supported_charts

logger = logging.getLogger("dentalbi.connection")

router = APIRouter(prefix="/api/connection", tags=["Connection"])


@router.post("/test", response_model=DBConnectionResult)
async def test_connection(
    req: DBConnectionTest,
    current_user: TokenData = Depends(get_current_user),
):
    """MSSQL 연결 테스트 — 연결 성공 여부 + 필수 테이블 확인"""
    try:
        adapter = get_chart_adapter(req.chart_type, req.database)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    mssql = MSSQLConnection(
        host=req.host,
        port=req.port,
        database=req.database,
        user=req.user,
        password=req.password,
        ehr_type=req.chart_type,
    )
    result = mssql.test_connection(adapter.required_tables)
    return DBConnectionResult(**result)


@router.post("/save")
async def save_connection(
    req: DBConnectionTest,
    current_user: TokenData = Depends(require_owner),
):
    """MSSQL 연결 정보를 clinic에 저장 (owner 권한 필요)"""
    # 먼저 연결 테스트
    try:
        adapter = get_chart_adapter(req.chart_type, req.database)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    mssql = MSSQLConnection(
        host=req.host,
        port=req.port,
        database=req.database,
        user=req.user,
        password=req.password,
        ehr_type=req.chart_type,
    )
    test_result = mssql.test_connection(adapter.required_tables)
    if not test_result.get("connected"):
        raise HTTPException(
            status_code=400,
            detail=f"DB 연결 실패: {test_result.get('error', '알 수 없는 오류')}",
        )

    # PostgreSQL에 저장
    try:
        conn = psycopg2.connect(settings.database_url)
        try:
            cur = conn.cursor()
            cur.execute(
                """
                UPDATE clinics
                SET mssql_host = %s, mssql_port = %s, mssql_database = %s,
                    mssql_user = %s, mssql_password = %s, ehr_type = %s,
                    agent_status = 'connected', updated_at = NOW()
                WHERE id = %s
                """,
                (req.host, req.port, req.database,
                 req.user, req.password, req.chart_type,
                 current_user.clinic_id),
            )
            conn.commit()
        finally:
            conn.close()
    except Exception as e:
        logger.error(f"연결 정보 저장 실패: {e}")
        raise HTTPException(status_code=500, detail="연결 정보 저장에 실패했습니다")

    return {
        "success": True,
        "message": "DB 연결 정보가 저장되었습니다",
        "test_result": test_result,
    }


@router.get("/status")
async def connection_status(
    current_user: TokenData = Depends(get_current_user),
):
    """현재 clinic의 MSSQL 연결 상태 확인"""
    try:
        conn = psycopg2.connect(settings.database_url)
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT mssql_host, mssql_database, ehr_type, agent_status, last_sync_at
                FROM clinics WHERE id = %s
                """,
                (current_user.clinic_id,),
            )
            row = cur.fetchone()
        finally:
            conn.close()

        if not row:
            return {"connected": False, "message": "병원 정보를 찾을 수 없습니다"}

        host, database, ehr_type, status, last_sync = row
        return {
            "connected": bool(host and database),
            "host": host,
            "database": database,
            "ehr_type": ehr_type,
            "status": status,
            "last_sync_at": last_sync.isoformat() if last_sync else None,
            "supported_charts": list_supported_charts(),
        }
    except Exception as e:
        logger.error(f"연결 상태 확인 실패: {e}")
        return {"connected": False, "error": str(e)}
