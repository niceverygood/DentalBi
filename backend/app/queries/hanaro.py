"""
하나로 3.0 전자차트 어댑터
- 하나로 3.0 MSSQL DB 스키마에 맞는 SQL 쿼리
- 테이블: tb_staff_info, tb_accept, tb_account_book_settlement_info,
          tb_account_book, tb_patient_info, tb_treatment, tb_reservation
"""
from datetime import datetime, timedelta
from typing import List

from app.queries.base import BaseChartAdapter


class HanaroAdapter(BaseChartAdapter):
    """하나로 3.0 전자차트 어댑터"""

    @property
    def chart_type(self) -> str:
        return "hanaro"

    @property
    def required_tables(self) -> List[str]:
        return [
            "tb_staff_info",
            "tb_accept",
            "tb_account_book_settlement_info",
            "tb_account_book",
            "tb_patient_info",
        ]

    def doctor_performance(self, start_date: str, end_date: str) -> str:
        db = self.db
        return f"""
        SELECT
            a.staff_id,
            a.staff_name AS doctor_name,
            a.religion AS specialty,
            ISNULL(b.new_patients, 0) AS new_patients,
            ISNULL(b.old_patients, 0) AS old_patients,
            ISNULL(b.total_visits, 0) AS total_visits,
            ISNULL(b.distinct_patients, 0) AS distinct_patients,
            CASE WHEN ISNULL(b.distinct_patients, 0) > 0
                THEN ROUND(CAST(ISNULL(b.total_visits, 0) AS FLOAT) / b.distinct_patients, 2)
                ELSE 0 END AS avg_visits,
            ISNULL(e.total_revenue, 0) AS total_revenue,
            ISNULL(e.corp_fee, 0) AS corp_fee,
            ISNULL(e.total_payment, 0) AS total_payment,
            ISNULL(n.new_patient_count, 0) AS new_patient_count_9m,
            ISNULL(n.new_patient_revenue, 0) AS new_patient_revenue_9m
        FROM (
            SELECT staff_id, staff_name, religion
            FROM {db}.dbo.tb_staff_info WITH (NOLOCK)
            WHERE position_div = 2 AND retirement_flag = 0
        ) a
        LEFT JOIN (
            SELECT
                doct_id,
                COUNT(CASE WHEN pnt_newold = 'N' THEN pnt_id END) AS new_patients,
                COUNT(CASE WHEN pnt_newold = 'O' THEN pnt_id END) AS old_patients,
                COUNT(pnt_id) AS total_visits,
                COUNT(DISTINCT pnt_id) AS distinct_patients
            FROM {db}.dbo.tb_accept WITH (NOLOCK)
            WHERE LEFT(acpt_dat, 8) BETWEEN '{start_date}' AND '{end_date}'
            GROUP BY doct_id
        ) b ON b.doct_id = a.staff_id
        LEFT JOIN (
            SELECT
                doctor_id,
                SUM(ISNULL(card_sum_fee, 0) + ISNULL(cash_recognition_sum_fee, 0)
                    + ISNULL(cash_sum_fee, 0) + ISNULL(online_sum_fee, 0)) AS total_payment,
                SUM(ISNULL(card_sum_fee, 0) + ISNULL(cash_recognition_sum_fee, 0)
                    + ISNULL(cash_sum_fee, 0) + ISNULL(online_sum_fee, 0))
                + SUM(CASE WHEN tab.sequence <= 1 THEN ISNULL(tab.corporation_fee, 0) ELSE 0 END) AS total_revenue,
                SUM(CASE WHEN tab.sequence <= 1 THEN ISNULL(tab.corporation_fee, 0) ELSE 0 END) AS corp_fee
            FROM {db}.dbo.tb_account_book_settlement_info tabs WITH (NOLOCK)
            LEFT JOIN {db}.dbo.tb_account_book tab WITH (NOLOCK)
                ON tabs.patient_id = tab.patient_id
                AND tabs.account_book_date = tab.account_book_date
            WHERE LEFT(tabs.account_book_date, 8) BETWEEN '{start_date}' AND '{end_date}'
            GROUP BY doctor_id
        ) e ON e.doctor_id = a.staff_id
        LEFT JOIN (
            SELECT
                doctor_id,
                COUNT(DISTINCT tabs.patient_id) AS new_patient_count,
                SUM(CASE WHEN tab.sequence <= 1 THEN ISNULL(tab.corporation_fee, 0) ELSE 0 END)
                + SUM(ISNULL(card_sum_fee, 0) + ISNULL(cash_recognition_sum_fee, 0)
                    + ISNULL(cash_sum_fee, 0) + ISNULL(online_sum_fee, 0)) AS new_patient_revenue
            FROM {db}.dbo.tb_account_book_settlement_info tabs WITH (NOLOCK)
            LEFT JOIN {db}.dbo.tb_account_book tab WITH (NOLOCK)
                ON tabs.patient_id = tab.patient_id
                AND tabs.account_book_date = tab.account_book_date
            LEFT JOIN {db}.dbo.tb_patient_info tpi WITH (NOLOCK)
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

    def payment_summary(self, start_date: str, end_date: str) -> str:
        db = self.db
        return f"""
        SELECT
            SUM(ISNULL(card_sum_fee, 0)) AS card_total,
            SUM(ISNULL(cash_sum_fee, 0)) AS cash_total,
            SUM(ISNULL(cash_recognition_sum_fee, 0)) AS cash_receipt_total,
            SUM(ISNULL(online_sum_fee, 0)) AS online_total,
            SUM(CASE WHEN tab.sequence <= 1 THEN ISNULL(tab.corporation_fee, 0) ELSE 0 END) AS corp_fee_total,
            COUNT(DISTINCT tabs.patient_id) AS total_patients
        FROM {db}.dbo.tb_account_book_settlement_info tabs WITH (NOLOCK)
        LEFT JOIN {db}.dbo.tb_account_book tab WITH (NOLOCK)
            ON tabs.patient_id = tab.patient_id
            AND tabs.account_book_date = tab.account_book_date
        WHERE LEFT(tabs.account_book_date, 8) BETWEEN '{start_date}' AND '{end_date}'
        """

    def daily_revenue_trend(self, start_date: str, end_date: str) -> str:
        db = self.db
        return f"""
        SELECT
            LEFT(tabs.account_book_date, 8) AS revenue_date,
            SUM(ISNULL(card_sum_fee, 0) + ISNULL(cash_recognition_sum_fee, 0)
                + ISNULL(cash_sum_fee, 0) + ISNULL(online_sum_fee, 0)) AS total_payment,
            SUM(CASE WHEN tab.sequence <= 1 THEN ISNULL(tab.corporation_fee, 0) ELSE 0 END) AS corp_fee,
            COUNT(DISTINCT tabs.patient_id) AS patient_count
        FROM {db}.dbo.tb_account_book_settlement_info tabs WITH (NOLOCK)
        LEFT JOIN {db}.dbo.tb_account_book tab WITH (NOLOCK)
            ON tabs.patient_id = tab.patient_id
            AND tabs.account_book_date = tab.account_book_date
        WHERE LEFT(tabs.account_book_date, 8) BETWEEN '{start_date}' AND '{end_date}'
        GROUP BY LEFT(tabs.account_book_date, 8)
        ORDER BY revenue_date
        """

    def turnaway_patients(self, months_back: int = 6) -> str:
        db = self.db
        cutoff = (datetime.now() - timedelta(days=30 * months_back)).strftime("%Y%m%d")
        return f"""
        SELECT
            a.pnt_id,
            a.doct_id,
            si.staff_name AS doctor_name,
            pi.pnt_name,
            MAX(a.acpt_dat) AS last_visit_date,
            DATEDIFF(DAY, CAST(LEFT(MAX(a.acpt_dat), 8) AS DATE), GETDATE()) AS days_since_visit
        FROM {db}.dbo.tb_accept a WITH (NOLOCK)
        LEFT JOIN {db}.dbo.tb_patient_info pi WITH (NOLOCK) ON a.pnt_id = pi.pnt_id
        LEFT JOIN {db}.dbo.tb_staff_info si WITH (NOLOCK) ON a.doct_id = si.staff_id
        WHERE LEFT(a.acpt_dat, 8) >= '{cutoff}'
        GROUP BY a.pnt_id, a.doct_id, si.staff_name, pi.pnt_name
        HAVING DATEDIFF(DAY, CAST(LEFT(MAX(a.acpt_dat), 8) AS DATE), GETDATE()) >= 30
            AND a.pnt_id NOT IN (
                SELECT DISTINCT patient_id
                FROM {db}.dbo.tb_reservation WITH (NOLOCK)
                WHERE reservation_date >= CONVERT(VARCHAR(8), GETDATE(), 112)
            )
        ORDER BY days_since_visit DESC
        """

    def lost_patients_ext_to_impl(self) -> str:
        db = self.db
        return f"""
        ;WITH extractions AS (
            SELECT
                t.patient_id,
                t.tooth_number,
                t.treatment_date,
                pi.pnt_name
            FROM {db}.dbo.tb_treatment t WITH (NOLOCK)
            LEFT JOIN {db}.dbo.tb_patient_info pi WITH (NOLOCK) ON t.patient_id = pi.pnt_id
            WHERE t.treatment_code LIKE '%EXT%'
                AND t.tooth_number NOT IN (18, 28, 38, 48)
                AND t.treatment_date >= CONVERT(VARCHAR(8), DATEADD(YEAR, -1, GETDATE()), 112)
        ),
        followups AS (
            SELECT DISTINCT patient_id, tooth_number
            FROM {db}.dbo.tb_treatment WITH (NOLOCK)
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

    def lost_patients_endo_to_crown(self) -> str:
        db = self.db
        return f"""
        ;WITH endos AS (
            SELECT
                t.patient_id,
                t.tooth_number,
                t.treatment_date,
                pi.pnt_name
            FROM {db}.dbo.tb_treatment t WITH (NOLOCK)
            LEFT JOIN {db}.dbo.tb_patient_info pi WITH (NOLOCK) ON t.patient_id = pi.pnt_id
            WHERE (t.treatment_code LIKE '%ENDO%' OR t.treatment_code LIKE '%RCT%'
                   OR t.treatment_code LIKE '%근충%')
                AND t.treatment_date >= CONVERT(VARCHAR(8), DATEADD(YEAR, -1, GETDATE()), 112)
        ),
        crowns AS (
            SELECT DISTINCT patient_id, tooth_number
            FROM {db}.dbo.tb_treatment WITH (NOLOCK)
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

    def new_patient_analysis(self, start_date: str, end_date: str) -> str:
        db = self.db
        return f"""
        SELECT
            pi.pnt_id,
            pi.registration_date,
            pi.pnt_sex AS gender,
            pi.pnt_age AS age,
            first_visit.doct_id AS first_doctor_id,
            sd1.staff_name AS first_doctor_name,
            ISNULL(payments.total_payment, 0) AS total_payment,
            ISNULL(visits.visit_count, 0) AS visit_count,
            visits.last_visit_date,
            DATEDIFF(DAY,
                CAST(pi.registration_date AS DATE),
                CAST(visits.last_visit_date AS DATE)
            ) AS duration_days
        FROM {db}.dbo.tb_patient_info pi WITH (NOLOCK)
        OUTER APPLY (
            SELECT TOP 1 doct_id
            FROM {db}.dbo.tb_accept WITH (NOLOCK)
            WHERE pnt_id = pi.pnt_id
            ORDER BY acpt_dat ASC
        ) first_visit
        LEFT JOIN {db}.dbo.tb_staff_info sd1 WITH (NOLOCK) ON first_visit.doct_id = sd1.staff_id
        LEFT JOIN (
            SELECT
                patient_id,
                SUM(ISNULL(card_sum_fee, 0) + ISNULL(cash_recognition_sum_fee, 0)
                    + ISNULL(cash_sum_fee, 0) + ISNULL(online_sum_fee, 0)) AS total_payment
            FROM {db}.dbo.tb_account_book_settlement_info WITH (NOLOCK)
            GROUP BY patient_id
        ) payments ON payments.patient_id = pi.pnt_id
        LEFT JOIN (
            SELECT
                pnt_id,
                COUNT(*) AS visit_count,
                MAX(acpt_dat) AS last_visit_date
            FROM {db}.dbo.tb_accept WITH (NOLOCK)
            GROUP BY pnt_id
        ) visits ON visits.pnt_id = pi.pnt_id
        WHERE pi.registration_date BETWEEN '{start_date}' AND '{end_date}'
        ORDER BY pi.registration_date DESC
        """

    def dashboard_overview(self, start_date: str, end_date: str) -> str:
        db = self.db
        return f"""
        SELECT
            COUNT(DISTINCT CASE WHEN pnt_newold = 'N' THEN a.pnt_id END) AS total_new_patients,
            COUNT(a.pnt_id) AS total_visits,
            COUNT(DISTINCT a.pnt_id) AS total_distinct_patients,
            (SELECT COUNT(*) FROM {db}.dbo.tb_staff_info WITH (NOLOCK)
             WHERE position_div = 2 AND retirement_flag = 0) AS active_doctors,
            ISNULL((
                SELECT SUM(ISNULL(card_sum_fee, 0) + ISNULL(cash_recognition_sum_fee, 0)
                    + ISNULL(cash_sum_fee, 0) + ISNULL(online_sum_fee, 0))
                FROM {db}.dbo.tb_account_book_settlement_info WITH (NOLOCK)
                WHERE LEFT(account_book_date, 8) BETWEEN '{start_date}' AND '{end_date}'
            ), 0) AS total_payment,
            ISNULL((
                SELECT SUM(CASE WHEN tab.sequence <= 1 THEN ISNULL(tab.corporation_fee, 0) ELSE 0 END)
                FROM {db}.dbo.tb_account_book tab WITH (NOLOCK)
                WHERE LEFT(tab.account_book_date, 8) BETWEEN '{start_date}' AND '{end_date}'
            ), 0) AS total_corp_fee
        FROM {db}.dbo.tb_accept a WITH (NOLOCK)
        WHERE LEFT(a.acpt_dat, 8) BETWEEN '{start_date}' AND '{end_date}'
        """
