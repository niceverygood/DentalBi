"""
의사별 성과 API 라우터
/api/doctors/* — 의사별 수익, 진료건수, 신환 분석
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.utils.deps import get_current_user
from app.models.schemas import TokenData
from app.database import get_mssql_connection
from app.queries import get_chart_adapter
from app.queries.base import BaseChartAdapter

logger = logging.getLogger("dentalbi.doctors")

router = APIRouter(prefix="/api/doctors", tags=["Doctors"])


@router.get("/performance")
async def doctor_performance(
    period: str = Query("month", description="today|week|month|quarter|year"),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    current_user: TokenData = Depends(get_current_user),
):
    """의사별 성과 분석 — 수익, 신환수, 구환수, 진료건수"""
    start_date, end_date = BaseChartAdapter.get_date_range(period, start, end)

    try:
        mssql = get_mssql_connection(current_user.clinic_id)
        adapter = get_chart_adapter(mssql.ehr_type, mssql.database)
        query = adapter.doctor_performance(start_date, end_date)
        results = mssql.execute_query(query)

        # int 변환 (pymssql Decimal → int)
        for r in results:
            for key in ("total_revenue", "corp_fee", "total_payment",
                        "new_patients", "old_patients", "total_visits",
                        "distinct_patients", "new_patient_count_9m", "new_patient_revenue_9m"):
                if key in r and r[key] is not None:
                    r[key] = int(r[key])

        total_revenue = sum(r.get("total_revenue", 0) for r in results)

        return {
            "period": {"start": start_date, "end": end_date},
            "ehr_type": mssql.ehr_type,
            "total_revenue": total_revenue,
            "doctors": results,
        }
    except Exception as e:
        logger.warning(f"의사 성과 쿼리 실패: {e}")
        return {
            "period": {"start": start_date, "end": end_date},
            "doctors": [],
            "demo": True,
            "message": str(e),
        }
