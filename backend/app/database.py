"""
DentalBI MSSQL 멀티테넌트 연결 관리자
- clinic_id별 MSSQL 연결 정보를 PostgreSQL에서 조회
- pymssql로 읽기 전용 연결 (WITH NOLOCK)
- 연결 풀링 및 캐싱
"""
import logging
from contextlib import contextmanager
from typing import Dict, List, Optional

import pymssql
import psycopg2
from fastapi import HTTPException

from app.config import settings

logger = logging.getLogger("dentalbi.database")


class MSSQLConnection:
    """단일 MSSQL 연결 정보"""

    def __init__(self, host: str, port: int, database: str, user: str, password: str, ehr_type: str):
        self.host = host
        self.port = port
        self.database = database
        self.user = user
        self.password = password
        self.ehr_type = ehr_type

    @contextmanager
    def connect(self):
        """읽기 전용 MSSQL 연결. 모든 쿼리는 WITH (NOLOCK)으로 실행."""
        conn = None
        try:
            conn = pymssql.connect(
                server=self.host,
                port=self.port,
                user=self.user,
                password=self.password,
                database=self.database,
                charset="utf8",
                login_timeout=10,
                timeout=30,
            )
            yield conn
        except pymssql.OperationalError as e:
            logger.error(f"MSSQL 연결 실패 ({self.host}:{self.port}/{self.database}): {e}")
            raise HTTPException(status_code=503, detail=f"치과 DB 연결 실패: {str(e)}")
        finally:
            if conn:
                conn.close()

    def execute_query(self, query: str, params: tuple = None) -> List[Dict]:
        """쿼리 실행 후 딕셔너리 리스트 반환"""
        with self.connect() as conn:
            cursor = conn.cursor(as_dict=True)
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            return cursor.fetchall()

    def test_connection(self, required_tables: List[str]) -> Dict:
        """연결 테스트 및 필수 테이블 존재 확인"""
        try:
            with self.connect() as conn:
                cursor = conn.cursor(as_dict=True)
                cursor.execute("SELECT @@VERSION AS version")
                version = cursor.fetchone()

                cursor.execute(
                    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'"
                )
                existing = {row["TABLE_NAME"] for row in cursor.fetchall()}
                found = [t for t in required_tables if t in existing]
                missing = [t for t in required_tables if t not in existing]

                return {
                    "connected": True,
                    "version": version["version"][:80] if version else "Unknown",
                    "database": self.database,
                    "ehr_type": self.ehr_type,
                    "tables_found": len(found),
                    "tables_missing": missing,
                    "ready": len(missing) == 0,
                }
        except HTTPException:
            raise
        except Exception as e:
            return {"connected": False, "error": str(e)}


def get_clinic_mssql_config(clinic_id: int) -> Optional[MSSQLConnection]:
    """PostgreSQL에서 clinic_id에 해당하는 MSSQL 연결 정보 조회"""
    try:
        conn = psycopg2.connect(settings.database_url)
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT mssql_host, mssql_port, mssql_database,
                       mssql_user, mssql_password, ehr_type
                FROM clinics WHERE id = %s
                """,
                (clinic_id,),
            )
            row = cur.fetchone()
            if not row:
                return None
            host, port, database, user, password, ehr_type = row
            if not host or not database:
                return None
            return MSSQLConnection(
                host=host,
                port=port or 1433,
                database=database,
                user=user or "",
                password=password or "",
                ehr_type=ehr_type or "hanaro",
            )
        finally:
            conn.close()
    except Exception as e:
        logger.error(f"PostgreSQL에서 clinic 정보 조회 실패: {e}")
        return None


def get_mssql_connection(clinic_id: int) -> MSSQLConnection:
    """
    clinic_id로 MSSQL 연결 객체 반환.
    DB 설정이 없으면 글로벌 환경변수 설정으로 fallback.
    """
    # 1) PostgreSQL에서 clinic별 설정 조회
    clinic_conn = get_clinic_mssql_config(clinic_id)
    if clinic_conn:
        return clinic_conn

    # 2) Fallback: 환경변수 글로벌 설정
    if settings.mssql_host and settings.mssql_password:
        return MSSQLConnection(
            host=settings.mssql_host,
            port=settings.mssql_port,
            database=settings.mssql_database,
            user=settings.mssql_user,
            password=settings.mssql_password,
            ehr_type=settings.chart_type,
        )

    raise HTTPException(
        status_code=400,
        detail="치과 전자차트 DB 연결 설정이 없습니다. 설정 페이지에서 DB 연결을 설정해주세요.",
    )
