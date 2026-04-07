"""
대시보드 API 라우터
/api/dashboard/* — 종합 대시보드 KPI
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.utils.deps import get_current_user
from app.models.schemas import TokenData
from app.database import get_mssql_connection
from app.queries import get_chart_adapter
from app.queries.base import BaseChartAdapter

logger = logging.getLogger("dentalbi.dashboard")

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/overview")
async def dashboard_overview(
    period: str = Query("month", description="today|week|month|quarter|year"),
    start: Optional[str] = Query(None, description="시작일 (YYYYMMDD)"),
    end: Optional[str] = Query(None, description="종료일 (YYYYMMDD)"),
    current_user: TokenData = Depends(get_current_user),
):
    """대시보드 개요 KPI — 총수납, 신환수, 진료건수, 활동의사수"""
    start_date, end_date = BaseChartAdapter.get_date_range(period, start, end)

    try:
        mssql = get_mssql_connection(current_user.clinic_id)
        adapter = get_chart_adapter(mssql.ehr_type, mssql.database)
        query = adapter.dashboard_overview(start_date, end_date)
        results = mssql.execute_query(query)

        overview = results[0] if results else {}
        total_payment = int(overview.get("total_payment", 0) or 0)
        total_corp_fee = int(overview.get("total_corp_fee", 0) or 0)

        return {
            "period": {"start": start_date, "end": end_date},
            "ehr_type": mssql.ehr_type,
            "kpi": {
                "total_revenue": total_payment + total_corp_fee,
                "total_payment": total_payment,
                "total_corp_fee": total_corp_fee,
                "total_new_patients": int(overview.get("total_new_patients", 0) or 0),
                "total_visits": int(overview.get("total_visits", 0) or 0),
                "total_distinct_patients": int(overview.get("total_distinct_patients", 0) or 0),
                "active_doctors": int(overview.get("active_doctors", 0) or 0),
            },
        }
    except Exception as e:
        logger.warning(f"대시보드 쿼리 실패 (데모 모드): {e}")
        return {
            "period": {"start": start_date, "end": end_date},
            "kpi": {},
            "demo": True,
            "message": str(e),
        }
