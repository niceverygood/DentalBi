"""
환자 관리 API 라우터
/api/patients/* — 이탈 환자, 신환 분석
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.utils.deps import get_current_user
from app.models.schemas import TokenData
from app.database import get_mssql_connection
from app.queries import get_chart_adapter
from app.queries.base import BaseChartAdapter

logger = logging.getLogger("dentalbi.patients")

router = APIRouter(prefix="/api/patients", tags=["Patients"])


@router.get("/turnaway")
async def turnaway_patients(
    months: int = Query(6, ge=1, le=24),
    current_user: TokenData = Depends(get_current_user),
):
    """Turn-away 환자 목록 — 마지막 진료 후 예약 없는 환자"""
    try:
        mssql = get_mssql_connection(current_user.clinic_id)
        adapter = get_chart_adapter(mssql.ehr_type, mssql.database)
        query = adapter.turnaway_patients(months)
        results = mssql.execute_query(query)

        for r in results:
            if "days_since_visit" in r and r["days_since_visit"] is not None:
                r["days_since_visit"] = int(r["days_since_visit"])

        return {
            "total_count": len(results),
            "patients": results[:100],
        }
    except Exception as e:
        logger.warning(f"Turn-away 쿼리 실패: {e}")
        return {"total_count": 0, "patients": [], "demo": True, "message": str(e)}


@router.get("/lost/ext-to-impl")
async def lost_patients_extraction(
    current_user: TokenData = Depends(get_current_user),
):
    """Lost Patient: 발치 후 임플란트/브릿지 미진행"""
    try:
        mssql = get_mssql_connection(current_user.clinic_id)
        adapter = get_chart_adapter(mssql.ehr_type, mssql.database)
        query = adapter.lost_patients_ext_to_impl()
        results = mssql.execute_query(query)
        return {"total_count": len(results), "patients": results}
    except Exception as e:
        logger.warning(f"Lost (EXT→IMPL) 쿼리 실패: {e}")
        return {"total_count": 0, "patients": [], "demo": True, "message": str(e)}


@router.get("/lost/endo-to-crown")
async def lost_patients_endo(
    current_user: TokenData = Depends(get_current_user),
):
    """Lost Patient: 근관치료 후 크라운 미진행"""
    try:
        mssql = get_mssql_connection(current_user.clinic_id)
        adapter = get_chart_adapter(mssql.ehr_type, mssql.database)
        query = adapter.lost_patients_endo_to_crown()
        results = mssql.execute_query(query)
        return {"total_count": len(results), "patients": results}
    except Exception as e:
        logger.warning(f"Lost (ENDO→CROWN) 쿼리 실패: {e}")
        return {"total_count": 0, "patients": [], "demo": True, "message": str(e)}


@router.get("/new")
async def new_patient_analysis(
    period: str = Query("month"),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    current_user: TokenData = Depends(get_current_user),
):
    """신환 분석 — 초진의사별, 내원기간별 수납 분석"""
    start_date, end_date = BaseChartAdapter.get_date_range(period, start, end)

    try:
        mssql = get_mssql_connection(current_user.clinic_id)
        adapter = get_chart_adapter(mssql.ehr_type, mssql.database)
        query = adapter.new_patient_analysis(start_date, end_date)
        results = mssql.execute_query(query)

        for r in results:
            for key in ("total_payment", "visit_count", "duration_days", "age"):
                if key in r and r[key] is not None:
                    r[key] = int(r[key])

        return {
            "period": {"start": start_date, "end": end_date},
            "total_new_patients": len(results),
            "patients": results[:200],
        }
    except Exception as e:
        logger.warning(f"신환 분석 쿼리 실패: {e}")
        return {
            "period": {"start": start_date, "end": end_date},
            "total_new_patients": 0,
            "patients": [],
            "demo": True,
            "message": str(e),
        }
