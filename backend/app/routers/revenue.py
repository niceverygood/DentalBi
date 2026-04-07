"""
수납 관리 API 라우터
/api/revenue/* — 수납 방법별 집계, 일별 추이
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.utils.deps import get_current_user
from app.models.schemas import TokenData
from app.database import get_mssql_connection
from app.queries import get_chart_adapter
from app.queries.base import BaseChartAdapter

logger = logging.getLogger("dentalbi.revenue")

router = APIRouter(prefix="/api/revenue", tags=["Revenue"])


@router.get("/payment-breakdown")
async def payment_breakdown(
    period: str = Query("month"),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    current_user: TokenData = Depends(get_current_user),
):
    """수납 방법별 집계 — 카드/현금/현금영수증/온라인/공단부담금"""
    start_date, end_date = BaseChartAdapter.get_date_range(period, start, end)

    try:
        mssql = get_mssql_connection(current_user.clinic_id)
        adapter = get_chart_adapter(mssql.ehr_type, mssql.database)
        query = adapter.payment_summary(start_date, end_date)
        results = mssql.execute_query(query)
        breakdown = results[0] if results else {}

        # int 변환
        for key in ("card_total", "cash_total", "cash_receipt_total",
                     "online_total", "corp_fee_total", "total_patients"):
            if key in breakdown and breakdown[key] is not None:
                breakdown[key] = int(breakdown[key])

        return {
            "period": {"start": start_date, "end": end_date},
            "breakdown": breakdown,
        }
    except Exception as e:
        logger.warning(f"수납 집계 쿼리 실패: {e}")
        return {
            "period": {"start": start_date, "end": end_date},
            "breakdown": {},
            "demo": True,
            "message": str(e),
        }


@router.get("/daily-trend")
async def daily_revenue_trend(
    period: str = Query("month"),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    current_user: TokenData = Depends(get_current_user),
):
    """일별 수익 추이"""
    start_date, end_date = BaseChartAdapter.get_date_range(period, start, end)

    try:
        mssql = get_mssql_connection(current_user.clinic_id)
        adapter = get_chart_adapter(mssql.ehr_type, mssql.database)
        query = adapter.daily_revenue_trend(start_date, end_date)
        results = mssql.execute_query(query)

        for r in results:
            for key in ("total_payment", "corp_fee", "patient_count"):
                if key in r and r[key] is not None:
                    r[key] = int(r[key])

        return {
            "period": {"start": start_date, "end": end_date},
            "daily": results,
        }
    except Exception as e:
        logger.warning(f"일별 추이 쿼리 실패: {e}")
        return {
            "period": {"start": start_date, "end": end_date},
            "daily": [],
            "demo": True,
            "message": str(e),
        }
