"""
DentalBI Backend API Server
============================
치과 전자차트 MSSQL DB에 읽기 전용 연결하여 경영 분석 데이터를 제공하는 FastAPI 서버.

설치:
    pip install fastapi uvicorn pymssql pydantic python-dotenv anthropic apscheduler

실행:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload

환경변수 (.env):
    MSSQL_HOST=192.168.0.100
    MSSQL_PORT=1433
    MSSQL_DATABASE=hanaro
    MSSQL_USER=dentalbi_reader
    MSSQL_PASSWORD=your_password
    CLAUDE_API_KEY=sk-ant-...
    CHART_TYPE=hanaro  # hanaro | dentweb | oneclick
"""

import os
import logging
from datetime import datetime, timedelta, date
from typing import Optional, List, Dict, Any
from contextlib import contextmanager
from functools import lru_cache
from enum import Enum

import pymssql
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dentalbi")

# ═══════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════
class ChartType(str, Enum):
    HANARO = "hanaro"
    DENTWEB = "dentweb"
    ONECLICK = "oneclick"

class DBConfig(BaseModel):
    host: str = Field(default_factory=lambda: os.getenv("MSSQL_HOST", "localhost"))
    port: int = Field(default_factory=lambda: int(os.getenv("MSSQL_PORT", "1433")))
    database: str = Field(default_factory=lambda: os.getenv("MSSQL_DATABASE", "hanaro"))
    user: str = Field(default_factory=lambda: os.getenv("MSSQL_USER", "dentalbi_reader"))
    password: str = Field(default_factory=lambda: os.getenv("MSSQL_PASSWORD", ""))
    chart_type: ChartType = Field(default_factory=lambda: ChartType(os.getenv("CHART_TYPE", "hanaro")))

# ═══════════════════════════════════════════════
# Database Connection
# ═══════════════════════════════════════════════
class DentalDB:
    """치과 전자차트 MSSQL DB 연결 관리자"""

    def __init__(self, config: DBConfig):
        self.config = config

    @contextmanager
    def get_connection(self):
        """읽기 전용 DB 연결. 모든 쿼리는 WITH (NOLOCK)으로 실행."""
        conn = None
        try:
            conn = pymssql.connect(
                server=self.config.host,
                port=self.config.port,
                user=self.config.user,
                password=self.config.password,
                database=self.config.database,
                charset="utf8",
                login_timeout=10,
                timeout=30,
            )
            yield conn
        except pymssql.OperationalError as e:
            logger.error(f"DB 연결 실패: {e}")
            raise HTTPException(status_code=503, detail=f"DB 연결 실패: {str(e)}")
        finally:
            if conn:
                conn.close()

    def execute_query(self, query: str, params: tuple = None) -> List[Dict]:
        """쿼리 실행 후 딕셔너리 리스트 반환"""
        with self.get_connection() as conn:
            cursor = conn.cursor(as_dict=True)
            cursor.execute(query, params)
            return cursor.fetchall()

    def test_connection(self) -> Dict:
        """연결 테스트 및 테이블 존재 확인"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor(as_dict=True)
                cursor.execute("SELECT @@VERSION AS version")
                version = cursor.fetchone()

                # 핵심 테이블 존재 확인
                required_tables = [
                    "tb_staff_info",
                    "tb_accept",
                    "tb_account_book_settlement_info",
                    "tb_account_book",
                    "tb_patient_info",
                ]
                cursor.execute(
                    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'"
                )
                existing = {row["TABLE_NAME"] for row in cursor.fetchall()}
                found = [t for t in required_tables if t in existing]
                missing = [t for t in required_tables if t not in existing]

                return {
                    "connected": True,
                    "version": version["version"][:80] if version else "Unknown",
                    "database": self.config.database,
                    "tables_found": len(found),
                    "tables_missing": missing,
                    "ready": len(missing) == 0,
                }
        except Exception as e:
            return {"connected": False, "error": str(e)}


# ═══════════════════════════════════════════════
# SQL Queries - 강의 p.72 기반 실제 쿼리
# ═══════════════════════════════════════════════
class DentalQueries:
    """
    치과 전자차트 DB 쿼리 모음.
    서울대 강의 p.72의 SQL을 기반으로 프로덕션 수준으로 정리.
    모든 쿼리는 WITH (NOLOCK)으로 실행하여 진료 중 DB 부하를 최소화.
    """

    @staticmethod
    def doctor_performance(start_date: str, end_date: str) -> str:
        """
        의사별 성과 분석 (강의 p.72 FrmSales.aspx 쿼리 기반)
        - 총수익, 공단부담금, 총수납, 신환수, 구환건수, 총진료건수, 총환자수, 평균내원횟수
        - 신환당 수익 (최근 9개월 기준)
        """
        return f"""
        SELECT
            a.staff_id,
            a.staff_name AS doctor_name,
            a.religion AS specialty,

            -- 진료 건수 집계 (tb_accept)
            ISNULL(b.new_patients, 0) AS new_patients,
            ISNULL(b.old_patients, 0) AS old_patients,
            ISNULL(b.total_visits, 0) AS total_visits,
            ISNULL(b.distinct_patients, 0) AS distinct_patients,
            CASE WHEN ISNULL(b.distinct_patients, 0) > 0
                THEN ROUND(CAST(ISNULL(b.total_visits, 0) AS FLOAT) / b.distinct_patients, 2)
                ELSE 0 END AS avg_visits,

            -- 수익 집계 (tb_account_book_settlement_info + tb_account_book)
            ISNULL(e.total_revenue, 0) AS total_revenue,
            ISNULL(e.corp_fee, 0) AS corp_fee,
            ISNULL(e.total_payment, 0) AS total_payment,

            -- 신환 수익 (최근 9개월 이내 등록 환자)
            ISNULL(n.new_patient_count, 0) AS new_patient_count_9m,
            ISNULL(n.new_patient_revenue, 0) AS new_patient_revenue_9m

        FROM (
            SELECT staff_id, staff_name, religion
            FROM {{}}.dbo.tb_staff_info WITH (NOLOCK)
            WHERE position_div = 2 AND retirement_flag = 0
        ) a

        -- 진료 접수 데이터
        LEFT JOIN (
            SELECT
                doct_id,
                COUNT(CASE WHEN pnt_newold = 'N' THEN pnt_id END) AS new_patients,
                COUNT(CASE WHEN pnt_newold = 'O' THEN pnt_id END) AS old_patients,
                COUNT(pnt_id) AS total_visits,
                COUNT(DISTINCT pnt_id) AS distinct_patients
            FROM {{}}.dbo.tb_accept WITH (NOLOCK)
            WHERE LEFT(acpt_dat, 8) BETWEEN '{start_date}' AND '{end_date}'
            GROUP BY doct_id
        ) b ON b.doct_id = a.staff_id

        -- 수납/수익 데이터
        LEFT JOIN (
            SELECT
                doctor_id,
                SUM(ISNULL(card_sum_fee, 0) + ISNULL(cash_recognition_sum_fee, 0)
                    + ISNULL(cash_sum_fee, 0) + ISNULL(online_sum_fee, 0)) AS total_payment,
                SUM(ISNULL(card_sum_fee, 0) + ISNULL(cash_recognition_sum_fee, 0)
                    + ISNULL(cash_sum_fee, 0) + ISNULL(online_sum_fee, 0))
                + SUM(CASE WHEN tab.sequence <= 1 THEN ISNULL(tab.corporation_fee, 0) ELSE 0 END) AS total_revenue,
                SUM(CASE WHEN tab.sequence <= 1 THEN ISNULL(tab.corporation_fee, 0) ELSE 0 END) AS corp_fee
            FROM {{}}.dbo.tb_account_book_settlement_info tabs WITH (NOLOCK)
            LEFT JOIN {{}}.dbo.tb_account_book tab WITH (NOLOCK)
                ON tabs.patient_id = tab.patient_id
                AND tabs.account_book_date = tab.account_book_date
            WHERE LEFT(tabs.account_book_date, 8) BETWEEN '{start_date}' AND '{end_date}'
            GROUP BY doctor_id
        ) e ON e.doctor_id = a.staff_id

        -- 신환 수익 (9개월 이내 등록)
        LEFT JOIN (
            SELECT
                doctor_id,
                COUNT(DISTINCT tabs.patient_id) AS new_patient_count,
                SUM(CASE WHEN tab.sequence <= 1 THEN ISNULL(tab.corporation_fee, 0) ELSE 0 END)
                + SUM(ISNULL(card_sum_fee, 0) + ISNULL(cash_recognition_sum_fee, 0)
                    + ISNULL(cash_sum_fee, 0) + ISNULL(online_sum_fee, 0)) AS new_patient_revenue
            FROM {{}}.dbo.tb_account_book_settlement_info tabs WITH (NOLOCK)
            LEFT JOIN {{}}.dbo.tb_account_book tab WITH (NOLOCK)
                ON tabs.patient_id = tab.patient_id
                AND tabs.account_book_date = tab.account_book_date
            LEFT JOIN {{}}.dbo.tb_patient_info tpi WITH (NOLOCK)
                ON tabs.patient_id = tpi.pnt_id
            WHERE LEFT(tabs.account_book_date, 8) BETWEEN '{start_date}' AND '{end_date}'
                AND REPLACE(LEFT(CONVERT(CHAR, DATEADD(MONTH, -9,
                    CONVERT(DATE, LEFT(tabs.account_book_date, 8))), 20), 10), '-', '')
                    < tpi.registration_date
            GROUP BY doctor_id
        ) n ON n.doctor_id = a.staff_id

        WHERE a.religion IS NOT NULL
        ORDER BY e.total_revenue DESC
        """

    @staticmethod
    def payment_summary(start_date: str, end_date: str) -> str:
        """수납 방법별 집계"""
        return f"""
        SELECT
            SUM(ISNULL(card_sum_fee, 0)) AS card_total,
            SUM(ISNULL(cash_sum_fee, 0)) AS cash_total,
            SUM(ISNULL(cash_recognition_sum_fee, 0)) AS cash_receipt_total,
            SUM(ISNULL(online_sum_fee, 0)) AS online_total,
            SUM(CASE WHEN tab.sequence <= 1 THEN ISNULL(tab.corporation_fee, 0) ELSE 0 END) AS corp_fee_total,
            COUNT(DISTINCT tabs.patient_id) AS total_patients
        FROM {{}}.dbo.tb_account_book_settlement_info tabs WITH (NOLOCK)
        LEFT JOIN {{}}.dbo.tb_account_book tab WITH (NOLOCK)
            ON tabs.patient_id = tab.patient_id
            AND tabs.account_book_date = tab.account_book_date
        WHERE LEFT(tabs.account_book_date, 8) BETWEEN '{start_date}' AND '{end_date}'
        """

    @staticmethod
    def turnaway_patients(months_back: int = 6) -> str:
        """
        Turn-away Patient 탐지 (강의 p.89-92)
        마지막 진료 후 예약이 없는 환자
        """
        cutoff = (datetime.now() - timedelta(days=30 * months_back)).strftime("%Y%m%d")
        return f"""
        SELECT
            a.pnt_id,
            a.doct_id,
            si.staff_name AS doctor_name,
            pi.pnt_name,
            MAX(a.acpt_dat) AS last_visit_date,
            DATEDIFF(DAY, CAST(LEFT(MAX(a.acpt_dat), 8) AS DATE), GETDATE()) AS days_since_visit
        FROM {{}}.dbo.tb_accept a WITH (NOLOCK)
        LEFT JOIN {{}}.dbo.tb_patient_info pi WITH (NOLOCK) ON a.pnt_id = pi.pnt_id
        LEFT JOIN {{}}.dbo.tb_staff_info si WITH (NOLOCK) ON a.doct_id = si.staff_id
        WHERE LEFT(a.acpt_dat, 8) >= '{cutoff}'
        GROUP BY a.pnt_id, a.doct_id, si.staff_name, pi.pnt_name
        HAVING DATEDIFF(DAY, CAST(LEFT(MAX(a.acpt_dat), 8) AS DATE), GETDATE()) >= 30
            AND a.pnt_id NOT IN (
                SELECT DISTINCT patient_id
                FROM {{}}.dbo.tb_reservation WITH (NOLOCK)
                WHERE reservation_date >= CONVERT(VARCHAR(8), GETDATE(), 112)
            )
        ORDER BY days_since_visit DESC
        """

    @staticmethod
    def lost_patients_ext_to_impl() -> str:
        """
        Lost Patient: 발치 후 임플란트/브릿지 미진행 (강의 p.94-95)
        제3대구치 발치 제외, 발치 후 해당 치아에 임플란트/브릿지 진행 안 된 환자
        """
        return """
        ;WITH extractions AS (
            SELECT
                t.patient_id,
                t.tooth_number,
                t.treatment_date,
                pi.pnt_name
            FROM {}.dbo.tb_treatment t WITH (NOLOCK)
            LEFT JOIN {}.dbo.tb_patient_info pi WITH (NOLOCK) ON t.patient_id = pi.pnt_id
            WHERE t.treatment_code LIKE '%EXT%'
                AND t.tooth_number NOT IN (18, 28, 38, 48)  -- 사랑니 제외
                AND t.treatment_date >= CONVERT(VARCHAR(8), DATEADD(YEAR, -1, GETDATE()), 112)
        ),
        followups AS (
            SELECT DISTINCT patient_id, tooth_number
            FROM {}.dbo.tb_treatment WITH (NOLOCK)
            WHERE (treatment_code LIKE '%IMP%' OR treatment_code LIKE '%BR%'
                   OR treatment_code LIKE '%IMPL%' OR treatment_code LIKE '%BRIDGE%')
        )
        SELECT
            e.patient_id,
            e.pnt_name,
            e.tooth_number,
            e.treatment_date AS extraction_date,
            DATEDIFF(DAY, CAST(e.treatment_date AS DATE), GETDATE()) AS days_since_extraction
        FROM extractions e
        LEFT JOIN followups f ON e.patient_id = f.patient_id AND e.tooth_number = f.tooth_number
        WHERE f.patient_id IS NULL
        ORDER BY e.treatment_date ASC
        """

    @staticmethod
    def lost_patients_endo_to_crown() -> str:
        """
        Lost Patient: 근관치료 후 크라운 미진행 (강의 p.96)
        """
        return """
        ;WITH endos AS (
            SELECT
                t.patient_id,
                t.tooth_number,
                t.treatment_date,
                pi.pnt_name
            FROM {}.dbo.tb_treatment t WITH (NOLOCK)
            LEFT JOIN {}.dbo.tb_patient_info pi WITH (NOLOCK) ON t.patient_id = pi.pnt_id
            WHERE (t.treatment_code LIKE '%ENDO%' OR t.treatment_code LIKE '%RCT%'
                   OR t.treatment_code LIKE '%근충%')
                AND t.treatment_date >= CONVERT(VARCHAR(8), DATEADD(YEAR, -1, GETDATE()), 112)
        ),
        crowns AS (
            SELECT DISTINCT patient_id, tooth_number
            FROM {}.dbo.tb_treatment WITH (NOLOCK)
            WHERE (treatment_code LIKE '%CR%' OR treatment_code LIKE '%CROWN%')
        )
        SELECT
            e.patient_id,
            e.pnt_name,
            e.tooth_number,
            e.treatment_date AS endo_date,
            DATEDIFF(DAY, CAST(e.treatment_date AS DATE), GETDATE()) AS days_since_endo
        FROM endos e
        LEFT JOIN crowns c ON e.patient_id = c.patient_id AND e.tooth_number = c.tooth_number
        WHERE c.patient_id IS NULL
        ORDER BY e.treatment_date ASC
        """

    @staticmethod
    def new_patient_analysis(start_date: str, end_date: str) -> str:
        """
        신환 분석 (강의 p.98-102)
        초진의사별/진료의사별 수납액, 내원기간별 수납 분석
        """
        return f"""
        SELECT
            pi.pnt_id,
            pi.registration_date,
            pi.pnt_sex AS gender,
            pi.pnt_age AS age,

            -- 초진 의사
            first_visit.doct_id AS first_doctor_id,
            sd1.staff_name AS first_doctor_name,

            -- 총 수납액
            ISNULL(payments.total_payment, 0) AS total_payment,

            -- 내원 횟수
            ISNULL(visits.visit_count, 0) AS visit_count,

            -- 마지막 내원일
            visits.last_visit_date,

            -- 내원 기간 (일)
            DATEDIFF(DAY,
                CAST(pi.registration_date AS DATE),
                CAST(visits.last_visit_date AS DATE)
            ) AS duration_days

        FROM {{}}.dbo.tb_patient_info pi WITH (NOLOCK)

        -- 초진 의사 (첫 접수 기록)
        OUTER APPLY (
            SELECT TOP 1 doct_id
            FROM {{}}.dbo.tb_accept WITH (NOLOCK)
            WHERE pnt_id = pi.pnt_id
            ORDER BY acpt_dat ASC
        ) first_visit
        LEFT JOIN {{}}.dbo.tb_staff_info sd1 WITH (NOLOCK) ON first_visit.doct_id = sd1.staff_id

        -- 총 수납액
        LEFT JOIN (
            SELECT
                patient_id,
                SUM(ISNULL(card_sum_fee, 0) + ISNULL(cash_recognition_sum_fee, 0)
                    + ISNULL(cash_sum_fee, 0) + ISNULL(online_sum_fee, 0)) AS total_payment
            FROM {{}}.dbo.tb_account_book_settlement_info WITH (NOLOCK)
            GROUP BY patient_id
        ) payments ON payments.patient_id = pi.pnt_id

        -- 내원 횟수
        LEFT JOIN (
            SELECT
                pnt_id,
                COUNT(*) AS visit_count,
                MAX(acpt_dat) AS last_visit_date
            FROM {{}}.dbo.tb_accept WITH (NOLOCK)
            GROUP BY pnt_id
        ) visits ON visits.pnt_id = pi.pnt_id

        WHERE pi.registration_date BETWEEN '{start_date}' AND '{end_date}'
        ORDER BY pi.registration_date DESC
        """

    @staticmethod
    def daily_revenue_trend(start_date: str, end_date: str) -> str:
        """일별 수익 추이"""
        return f"""
        SELECT
            LEFT(tabs.account_book_date, 8) AS revenue_date,
            SUM(ISNULL(card_sum_fee, 0) + ISNULL(cash_recognition_sum_fee, 0)
                + ISNULL(cash_sum_fee, 0) + ISNULL(online_sum_fee, 0)) AS total_payment,
            SUM(CASE WHEN tab.sequence <= 1 THEN ISNULL(tab.corporation_fee, 0) ELSE 0 END) AS corp_fee,
            COUNT(DISTINCT tabs.patient_id) AS patient_count
        FROM {{}}.dbo.tb_account_book_settlement_info tabs WITH (NOLOCK)
        LEFT JOIN {{}}.dbo.tb_account_book tab WITH (NOLOCK)
            ON tabs.patient_id = tab.patient_id
            AND tabs.account_book_date = tab.account_book_date
        WHERE LEFT(tabs.account_book_date, 8) BETWEEN '{start_date}' AND '{end_date}'
        GROUP BY LEFT(tabs.account_book_date, 8)
        ORDER BY revenue_date
        """


# ═══════════════════════════════════════════════
# API Models
# ═══════════════════════════════════════════════
class DateRange(BaseModel):
    start_date: str = Field(description="시작일 (YYYYMMDD)")
    end_date: str = Field(description="종료일 (YYYYMMDD)")

class ConnectionTestRequest(BaseModel):
    host: str
    port: int = 1433
    database: str = "hanaro"
    user: str
    password: str
    chart_type: str = "hanaro"

class ConnectionTestResponse(BaseModel):
    connected: bool
    version: Optional[str] = None
    database: Optional[str] = None
    tables_found: Optional[int] = None
    tables_missing: Optional[List[str]] = None
    ready: Optional[bool] = None
    error: Optional[str] = None


# ═══════════════════════════════════════════════
# FastAPI App
# ═══════════════════════════════════════════════
app = FastAPI(
    title="DentalBI API",
    description="치과 AI 경영 대시보드 백엔드 API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB 인스턴스
db_config = DBConfig()
db = DentalDB(db_config)
queries = DentalQueries()


def get_date_range(
    period: str = Query("month", description="today|week|month|quarter|year"),
    start: Optional[str] = None,
    end: Optional[str] = None,
) -> tuple:
    """기간 파라미터를 날짜 범위로 변환"""
    today = date.today()
    if start and end:
        return start, end
    ranges = {
        "today": (today, today),
        "week": (today - timedelta(days=today.weekday()), today),
        "month": (today.replace(day=1), today),
        "quarter": (today.replace(month=((today.month-1)//3)*3+1, day=1), today),
        "year": (today.replace(month=1, day=1), today),
    }
    s, e = ranges.get(period, ranges["month"])
    return s.strftime("%Y%m%d"), e.strftime("%Y%m%d")


# ─── Endpoints ───

@app.get("/")
def root():
    return {"service": "DentalBI API", "version": "1.0.0", "status": "running"}


@app.post("/api/connection/test", response_model=ConnectionTestResponse)
def test_connection(req: ConnectionTestRequest):
    """DB 연결 테스트"""
    config = DBConfig(
        host=req.host, port=req.port, database=req.database,
        user=req.user, password=req.password,
    )
    test_db = DentalDB(config)
    return test_db.test_connection()


@app.get("/api/dashboard/overview")
def dashboard_overview(dates: tuple = Depends(get_date_range)):
    """대시보드 개요 KPI"""
    start, end = dates
    query = queries.doctor_performance(start, end).format(
        db_config.database, db_config.database, db_config.database,
        db_config.database, db_config.database, db_config.database,
        db_config.database, db_config.database, db_config.database,
    )
    # 실제 DB 연결 시 아래 주석 해제
    # results = db.execute_query(query)
    # return {"period": {"start": start, "end": end}, "doctors": results}
    return {
        "period": {"start": start, "end": end},
        "message": "DB 연결 후 실제 데이터가 표시됩니다. /api/connection/test로 먼저 연결을 확인하세요.",
    }


@app.get("/api/doctors/performance")
def doctor_performance(dates: tuple = Depends(get_date_range)):
    """의사별 성과 분석"""
    start, end = dates
    dbname = db_config.database
    query = queries.doctor_performance(start, end).replace("{}", dbname)
    try:
        results = db.execute_query(query)
        total_revenue = sum(r.get("total_revenue", 0) for r in results)
        return {
            "period": {"start": start, "end": end},
            "total_revenue": total_revenue,
            "doctors": results,
        }
    except Exception as e:
        logger.warning(f"쿼리 실패 (데모 데이터 반환): {e}")
        return {"period": {"start": start, "end": end}, "doctors": [], "demo": True}


@app.get("/api/patients/turnaway")
def turnaway_patients(months: int = Query(6, ge=1, le=24)):
    """Turn-away Patient 목록"""
    dbname = db_config.database
    query = queries.turnaway_patients(months).replace("{}", dbname)
    try:
        results = db.execute_query(query)
        return {
            "total_count": len(results),
            "patients": results[:100],  # 최대 100명
        }
    except Exception as e:
        logger.warning(f"쿼리 실패: {e}")
        return {"total_count": 0, "patients": [], "demo": True}


@app.get("/api/patients/lost/ext-to-impl")
def lost_patients_extraction():
    """발치 후 임플란트/브릿지 미진행 환자"""
    dbname = db_config.database
    query = queries.lost_patients_ext_to_impl().replace("{}", dbname)
    try:
        results = db.execute_query(query)
        return {"total_count": len(results), "patients": results}
    except Exception as e:
        logger.warning(f"쿼리 실패: {e}")
        return {"total_count": 0, "patients": [], "demo": True}


@app.get("/api/patients/lost/endo-to-crown")
def lost_patients_endo():
    """근관치료 후 크라운 미진행 환자"""
    dbname = db_config.database
    query = queries.lost_patients_endo_to_crown().replace("{}", dbname)
    try:
        results = db.execute_query(query)
        return {"total_count": len(results), "patients": results}
    except Exception as e:
        logger.warning(f"쿼리 실패: {e}")
        return {"total_count": 0, "patients": [], "demo": True}


@app.get("/api/patients/new")
def new_patient_analysis(dates: tuple = Depends(get_date_range)):
    """신환 분석"""
    start, end = dates
    dbname = db_config.database
    query = queries.new_patient_analysis(start, end).replace("{}", dbname)
    try:
        results = db.execute_query(query)
        return {
            "period": {"start": start, "end": end},
            "total_new_patients": len(results),
            "patients": results[:200],
        }
    except Exception as e:
        logger.warning(f"쿼리 실패: {e}")
        return {"period": {"start": start, "end": end}, "total_new_patients": 0, "patients": [], "demo": True}


@app.get("/api/revenue/payment-breakdown")
def payment_breakdown(dates: tuple = Depends(get_date_range)):
    """수납 방법별 집계"""
    start, end = dates
    dbname = db_config.database
    query = queries.payment_summary(start, end).replace("{}", dbname)
    try:
        results = db.execute_query(query)
        return {"period": {"start": start, "end": end}, "breakdown": results[0] if results else {}}
    except Exception as e:
        logger.warning(f"쿼리 실패: {e}")
        return {"period": {"start": start, "end": end}, "breakdown": {}, "demo": True}


@app.get("/api/revenue/daily-trend")
def daily_revenue_trend(dates: tuple = Depends(get_date_range)):
    """일별 수익 추이"""
    start, end = dates
    dbname = db_config.database
    query = queries.daily_revenue_trend(start, end).replace("{}", dbname)
    try:
        results = db.execute_query(query)
        return {"period": {"start": start, "end": end}, "daily": results}
    except Exception as e:
        logger.warning(f"쿼리 실패: {e}")
        return {"period": {"start": start, "end": end}, "daily": [], "demo": True}


@app.get("/api/insights/generate")
def generate_ai_insights(dates: tuple = Depends(get_date_range)):
    """
    AI 인사이트 생성 (Claude API 연동)
    실제 프로덕션에서는 수집된 데이터를 Claude에 보내 분석 결과를 생성합니다.
    """
    start, end = dates
    api_key = os.getenv("CLAUDE_API_KEY")

    if not api_key:
        return {
            "insights": [
                {
                    "type": "info",
                    "title": "AI 인사이트 설정 필요",
                    "body": "CLAUDE_API_KEY 환경변수를 설정하면 AI 기반 경영 인사이트가 자동 생성됩니다.",
                    "action": "설정 가이드 보기",
                    "priority": "low",
                }
            ]
        }

    # Claude API를 통한 인사이트 생성 (실제 구현)
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        # 데이터 수집
        # doctors = db.execute_query(queries.doctor_performance(start, end).replace("{}", db_config.database))
        # ... 기타 데이터 수집 ...

        prompt = f"""
        당신은 치과 경영 분석 전문 AI 컨설턴트입니다.
        다음 데이터를 분석하여 경영 인사이트 3~5개를 JSON 형태로 생성하세요.

        분석 기간: {start} ~ {end}

        각 인사이트는 다음 형식입니다:
        {{
            "type": "warning|danger|success|info",
            "title": "인사이트 제목",
            "body": "구체적인 분석 내용과 수치",
            "action": "권장 액션",
            "priority": "high|medium|low"
        }}

        반드시 JSON 배열만 반환하세요.
        """

        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}],
        )

        import json
        insights = json.loads(message.content[0].text)
        return {"insights": insights, "generated_at": datetime.now().isoformat()}

    except Exception as e:
        logger.error(f"AI 인사이트 생성 실패: {e}")
        return {"insights": [], "error": str(e)}


# ─── Health Check ───
@app.get("/health")
def health_check():
    """서버 상태 확인"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "db_config": {
            "host": db_config.host,
            "database": db_config.database,
            "chart_type": db_config.chart_type,
        },
    }


# ─── Main ───
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
