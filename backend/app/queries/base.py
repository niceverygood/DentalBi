"""
전자차트 어댑터 베이스 클래스
- 모든 전자차트(하나로/덴트웹/원클릭) 어댑터의 공통 인터페이스 정의
- 각 어댑터는 이 클래스를 상속하여 차트 시스템별 SQL 쿼리를 구현
"""
from abc import ABC, abstractmethod
from datetime import datetime, timedelta, date
from typing import List


class BaseChartAdapter(ABC):
    """
    전자차트 어댑터 추상 클래스.
    각 메서드는 해당 전자차트 DB 스키마에 맞는 SQL 쿼리 문자열을 반환.
    """

    def __init__(self, database: str):
        """
        Args:
            database: MSSQL 데이터베이스명 (예: 'hanaro', 'dentweb_db')
        """
        self.db = database

    @property
    @abstractmethod
    def chart_type(self) -> str:
        """어댑터 식별자 (hanaro, dentweb, oneclick)"""
        ...

    @property
    @abstractmethod
    def required_tables(self) -> List[str]:
        """연결 테스트 시 확인할 필수 테이블 목록"""
        ...

    @abstractmethod
    def doctor_performance(self, start_date: str, end_date: str) -> str:
        """의사별 성과 분석 SQL"""
        ...

    @abstractmethod
    def payment_summary(self, start_date: str, end_date: str) -> str:
        """수납 방법별 집계 SQL"""
        ...

    @abstractmethod
    def daily_revenue_trend(self, start_date: str, end_date: str) -> str:
        """일별 수익 추이 SQL"""
        ...

    @abstractmethod
    def turnaway_patients(self, months_back: int = 6) -> str:
        """Turn-away 환자 (예약 없는 미내원 환자) SQL"""
        ...

    @abstractmethod
    def lost_patients_ext_to_impl(self) -> str:
        """발치 후 임플란트/브릿지 미진행 환자 SQL"""
        ...

    @abstractmethod
    def lost_patients_endo_to_crown(self) -> str:
        """근관치료 후 크라운 미진행 환자 SQL"""
        ...

    @abstractmethod
    def new_patient_analysis(self, start_date: str, end_date: str) -> str:
        """신환 분석 SQL"""
        ...

    @abstractmethod
    def dashboard_overview(self, start_date: str, end_date: str) -> str:
        """대시보드 개요 KPI SQL"""
        ...

    # ─── 공통 유틸리티 ───

    @staticmethod
    def get_date_range(period: str, start: str = None, end: str = None) -> tuple:
        """기간 파라미터를 YYYYMMDD 날짜 범위로 변환"""
        if start and end:
            return start, end
        today = date.today()
        ranges = {
            "today": (today, today),
            "week": (today - timedelta(days=today.weekday()), today),
            "month": (today.replace(day=1), today),
            "quarter": (today.replace(month=((today.month - 1) // 3) * 3 + 1, day=1), today),
            "year": (today.replace(month=1, day=1), today),
        }
        s, e = ranges.get(period, ranges["month"])
        return s.strftime("%Y%m%d"), e.strftime("%Y%m%d")
