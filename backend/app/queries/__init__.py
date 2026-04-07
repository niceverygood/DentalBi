"""
전자차트 어댑터 팩토리
- ehr_type에 따라 적절한 어댑터를 반환
- 지원: hanaro (하나로 3.0), dentweb (덴트웹), oneclick (원클릭)
"""
from app.queries.base import BaseChartAdapter
from app.queries.hanaro import HanaroAdapter
from app.queries.dentweb import DentwebAdapter
from app.queries.oneclick import OneclickAdapter

# 어댑터 레지스트리
_ADAPTERS = {
    "hanaro": HanaroAdapter,
    "dentweb": DentwebAdapter,
    "oneclick": OneclickAdapter,
}


def get_chart_adapter(ehr_type: str, database: str) -> BaseChartAdapter:
    """
    전자차트 타입에 맞는 어댑터 인스턴스 반환.

    Args:
        ehr_type: 전자차트 종류 (hanaro, dentweb, oneclick)
        database: MSSQL 데이터베이스명

    Returns:
        BaseChartAdapter 구현체

    Raises:
        ValueError: 지원하지 않는 전자차트 타입
    """
    adapter_cls = _ADAPTERS.get(ehr_type)
    if not adapter_cls:
        supported = ", ".join(_ADAPTERS.keys())
        raise ValueError(f"지원하지 않는 전자차트 타입: '{ehr_type}'. 지원: {supported}")
    return adapter_cls(database)


def list_supported_charts() -> list:
    """지원하는 전자차트 타입 목록"""
    return list(_ADAPTERS.keys())
