"""
원클릭(OneClick) 전자차트 어댑터
- 원클릭 MSSQL DB 스키마에 맞는 SQL 쿼리
- 테이블: tblDoctor, tblPatient, tblReceipt, tblPayment, tblTreatment, tblReservation
- 원클릭은 한글 칼럼명과 영문 테이블명 혼용,
  날짜는 VARCHAR(8) YYYYMMDD 형식 (하나로와 유사하나 테이블/칼럼명이 다름)
"""
from datetime import datetime, timedelta
from typing import List

from app.queries.base import BaseChartAdapter


class OneclickAdapter(BaseChartAdapter):
    """원클릭 전자차트 어댑터"""

    @property
    def chart_type(self) -> str:
        return "oneclick"

    @property
    def required_tables(self) -> List[str]:
        return [
            "tblDoctor",
            "tblPatient",
            "tblReceipt",
            "tblPayment",
            "tblTreatment",
        ]

    def doctor_performance(self, start_date: str, end_date: str) -> str:
        db = self.db
        return f"""
        SELECT
            d.DocCode AS staff_id,
            d.DocName AS doctor_name,
            d.Specialty AS specialty,
            ISNULL(v.new_patients, 0) AS new_patients,
            ISNULL(v.old_patients, 0) AS old_patients,
            ISNULL(v.total_visits, 0) AS total_visits,
            ISNULL(v.distinct_patients, 0) AS distinct_patients,
            CASE WHEN ISNULL(v.distinct_patients, 0) > 0
                THEN ROUND(CAST(ISNULL(v.total_visits, 0) AS FLOAT) / v.distinct_patients, 2)
                ELSE 0 END AS avg_visits,
            ISNULL(p.total_revenue, 0) AS total_revenue,
            ISNULL(p.corp_fee, 0) AS corp_fee,
            ISNULL(p.total_payment, 0) AS total_payment,
            0 AS new_patient_count_9m,
            0 AS new_patient_revenue_9m
        FROM {db}.dbo.tblDoctor d WITH (NOLOCK)
        LEFT JOIN (
            SELECT
                DocCode,
                COUNT(CASE WHEN NewFlag = 'Y' THEN PtCode END) AS new_patients,
                COUNT(CASE WHEN NewFlag <> 'Y' THEN PtCode END) AS old_patients,
                COUNT(PtCode) AS total_visits,
                COUNT(DISTINCT PtCode) AS distinct_patients
            FROM {db}.dbo.tblReceipt WITH (NOLOCK)
            WHERE RcpDate BETWEEN '{start_date}' AND '{end_date}'
            GROUP BY DocCode
        ) v ON v.DocCode = d.DocCode
        LEFT JOIN (
            SELECT
                r.DocCode,
                SUM(ISNULL(py.CardAmt, 0) + ISNULL(py.CashAmt, 0)
                    + ISNULL(py.CashRcptAmt, 0) + ISNULL(py.BankAmt, 0)) AS total_payment,
                SUM(ISNULL(py.CardAmt, 0) + ISNULL(py.CashAmt, 0)
                    + ISNULL(py.CashRcptAmt, 0) + ISNULL(py.BankAmt, 0))
                + SUM(ISNULL(py.InsurAmt, 0)) AS total_revenue,
                SUM(ISNULL(py.InsurAmt, 0)) AS corp_fee
            FROM {db}.dbo.tblReceipt r WITH (NOLOCK)
            INNER JOIN {db}.dbo.tblPayment py WITH (NOLOCK) ON r.RcpNo = py.RcpNo
            WHERE r.RcpDate BETWEEN '{start_date}' AND '{end_date}'
            GROUP BY r.DocCode
        ) p ON p.DocCode = d.DocCode
        WHERE d.UseFlag = 'Y'
        ORDER BY p.total_revenue DESC
        """

    def payment_summary(self, start_date: str, end_date: str) -> str:
        db = self.db
        return f"""
        SELECT
            SUM(ISNULL(py.CardAmt, 0)) AS card_total,
            SUM(ISNULL(py.CashAmt, 0)) AS cash_total,
            SUM(ISNULL(py.CashRcptAmt, 0)) AS cash_receipt_total,
            SUM(ISNULL(py.BankAmt, 0)) AS online_total,
            SUM(ISNULL(py.InsurAmt, 0)) AS corp_fee_total,
            COUNT(DISTINCT r.PtCode) AS total_patients
        FROM {db}.dbo.tblReceipt r WITH (NOLOCK)
        INNER JOIN {db}.dbo.tblPayment py WITH (NOLOCK) ON r.RcpNo = py.RcpNo
        WHERE r.RcpDate BETWEEN '{start_date}' AND '{end_date}'
        """

    def daily_revenue_trend(self, start_date: str, end_date: str) -> str:
        db = self.db
        return f"""
        SELECT
            r.RcpDate AS revenue_date,
            SUM(ISNULL(py.CardAmt, 0) + ISNULL(py.CashAmt, 0)
                + ISNULL(py.CashRcptAmt, 0) + ISNULL(py.BankAmt, 0)) AS total_payment,
            SUM(ISNULL(py.InsurAmt, 0)) AS corp_fee,
            COUNT(DISTINCT r.PtCode) AS patient_count
        FROM {db}.dbo.tblReceipt r WITH (NOLOCK)
        INNER JOIN {db}.dbo.tblPayment py WITH (NOLOCK) ON r.RcpNo = py.RcpNo
        WHERE r.RcpDate BETWEEN '{start_date}' AND '{end_date}'
        GROUP BY r.RcpDate
        ORDER BY r.RcpDate
        """

    def turnaway_patients(self, months_back: int = 6) -> str:
        db = self.db
        cutoff = (datetime.now() - timedelta(days=30 * months_back)).strftime("%Y%m%d")
        return f"""
        SELECT
            r.PtCode AS pnt_id,
            r.DocCode AS doct_id,
            d.DocName AS doctor_name,
            p.PtName AS pnt_name,
            MAX(r.RcpDate) AS last_visit_date,
            DATEDIFF(DAY, CAST(MAX(r.RcpDate) AS DATE), GETDATE()) AS days_since_visit
        FROM {db}.dbo.tblReceipt r WITH (NOLOCK)
        LEFT JOIN {db}.dbo.tblPatient p WITH (NOLOCK) ON r.PtCode = p.PtCode
        LEFT JOIN {db}.dbo.tblDoctor d WITH (NOLOCK) ON r.DocCode = d.DocCode
        WHERE r.RcpDate >= '{cutoff}'
        GROUP BY r.PtCode, r.DocCode, d.DocName, p.PtName
        HAVING DATEDIFF(DAY, CAST(MAX(r.RcpDate) AS DATE), GETDATE()) >= 30
            AND r.PtCode NOT IN (
                SELECT DISTINCT PtCode
                FROM {db}.dbo.tblReservation WITH (NOLOCK)
                WHERE RsvDate >= CONVERT(VARCHAR(8), GETDATE(), 112)
            )
        ORDER BY days_since_visit DESC
        """

    def lost_patients_ext_to_impl(self) -> str:
        db = self.db
        return f"""
        ;WITH extractions AS (
            SELECT
                t.PtCode AS patient_id,
                t.ToothNo AS tooth_number,
                t.TxDate AS treatment_date,
                p.PtName AS pnt_name
            FROM {db}.dbo.tblTreatment t WITH (NOLOCK)
            LEFT JOIN {db}.dbo.tblPatient p WITH (NOLOCK) ON t.PtCode = p.PtCode
            WHERE t.TxCode LIKE '%EXT%'
                AND t.ToothNo NOT IN (18, 28, 38, 48)
                AND t.TxDate >= CONVERT(VARCHAR(8), DATEADD(YEAR, -1, GETDATE()), 112)
        ),
        followups AS (
            SELECT DISTINCT PtCode AS patient_id, ToothNo AS tooth_number
            FROM {db}.dbo.tblTreatment WITH (NOLOCK)
            WHERE (TxCode LIKE '%IMP%' OR TxCode LIKE '%BR%'
                   OR TxCode LIKE '%IMPL%' OR TxCode LIKE '%BRIDGE%')
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

    def lost_patients_endo_to_crown(self) -> str:
        db = self.db
        return f"""
        ;WITH endos AS (
            SELECT
                t.PtCode AS patient_id,
                t.ToothNo AS tooth_number,
                t.TxDate AS treatment_date,
                p.PtName AS pnt_name
            FROM {db}.dbo.tblTreatment t WITH (NOLOCK)
            LEFT JOIN {db}.dbo.tblPatient p WITH (NOLOCK) ON t.PtCode = p.PtCode
            WHERE (t.TxCode LIKE '%ENDO%' OR t.TxCode LIKE '%RCT%')
                AND t.TxDate >= CONVERT(VARCHAR(8), DATEADD(YEAR, -1, GETDATE()), 112)
        ),
        crowns AS (
            SELECT DISTINCT PtCode AS patient_id, ToothNo AS tooth_number
            FROM {db}.dbo.tblTreatment WITH (NOLOCK)
            WHERE (TxCode LIKE '%CR%' OR TxCode LIKE '%CROWN%')
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

    def new_patient_analysis(self, start_date: str, end_date: str) -> str:
        db = self.db
        return f"""
        SELECT
            p.PtCode AS pnt_id,
            p.RegDate AS registration_date,
            p.Sex AS gender,
            p.Age AS age,
            fv.DocCode AS first_doctor_id,
            d.DocName AS first_doctor_name,
            ISNULL(pay.total_payment, 0) AS total_payment,
            ISNULL(vis.visit_count, 0) AS visit_count,
            vis.last_visit_date,
            DATEDIFF(DAY, CAST(p.RegDate AS DATE), CAST(vis.last_visit_date AS DATE)) AS duration_days
        FROM {db}.dbo.tblPatient p WITH (NOLOCK)
        OUTER APPLY (
            SELECT TOP 1 DocCode
            FROM {db}.dbo.tblReceipt WITH (NOLOCK)
            WHERE PtCode = p.PtCode
            ORDER BY RcpDate ASC
        ) fv
        LEFT JOIN {db}.dbo.tblDoctor d WITH (NOLOCK) ON fv.DocCode = d.DocCode
        LEFT JOIN (
            SELECT
                r.PtCode,
                SUM(ISNULL(py.CardAmt, 0) + ISNULL(py.CashAmt, 0)
                    + ISNULL(py.CashRcptAmt, 0) + ISNULL(py.BankAmt, 0)) AS total_payment
            FROM {db}.dbo.tblReceipt r WITH (NOLOCK)
            INNER JOIN {db}.dbo.tblPayment py WITH (NOLOCK) ON r.RcpNo = py.RcpNo
            GROUP BY r.PtCode
        ) pay ON pay.PtCode = p.PtCode
        LEFT JOIN (
            SELECT
                PtCode,
                COUNT(*) AS visit_count,
                MAX(RcpDate) AS last_visit_date
            FROM {db}.dbo.tblReceipt WITH (NOLOCK)
            GROUP BY PtCode
        ) vis ON vis.PtCode = p.PtCode
        WHERE p.RegDate BETWEEN '{start_date}' AND '{end_date}'
        ORDER BY p.RegDate DESC
        """

    def dashboard_overview(self, start_date: str, end_date: str) -> str:
        db = self.db
        return f"""
        SELECT
            COUNT(DISTINCT CASE WHEN r.NewFlag = 'Y' THEN r.PtCode END) AS total_new_patients,
            COUNT(r.RcpNo) AS total_visits,
            COUNT(DISTINCT r.PtCode) AS total_distinct_patients,
            (SELECT COUNT(*) FROM {db}.dbo.tblDoctor WITH (NOLOCK) WHERE UseFlag = 'Y') AS active_doctors,
            ISNULL((
                SELECT SUM(ISNULL(py.CardAmt, 0) + ISNULL(py.CashAmt, 0)
                    + ISNULL(py.CashRcptAmt, 0) + ISNULL(py.BankAmt, 0))
                FROM {db}.dbo.tblReceipt r2 WITH (NOLOCK)
                INNER JOIN {db}.dbo.tblPayment py WITH (NOLOCK) ON r2.RcpNo = py.RcpNo
                WHERE r2.RcpDate BETWEEN '{start_date}' AND '{end_date}'
            ), 0) AS total_payment,
            ISNULL((
                SELECT SUM(ISNULL(py.InsurAmt, 0))
                FROM {db}.dbo.tblReceipt r3 WITH (NOLOCK)
                INNER JOIN {db}.dbo.tblPayment py WITH (NOLOCK) ON r3.RcpNo = py.RcpNo
                WHERE r3.RcpDate BETWEEN '{start_date}' AND '{end_date}'
            ), 0) AS total_corp_fee
        FROM {db}.dbo.tblReceipt r WITH (NOLOCK)
        WHERE r.RcpDate BETWEEN '{start_date}' AND '{end_date}'
        """
