"""
덴트웹(DentWeb) 전자차트 어댑터
- 덴트웹 MSSQL DB 스키마에 맞는 SQL 쿼리
- 테이블: Doctor, Patient, Receipt, ReceiptDetail, Treatment, Reservation
- 덴트웹은 영문 테이블명과 칼럼명을 사용하며,
  날짜는 DATETIME 형식 (하나로의 YYYYMMDD 문자열과 다름)
"""
from datetime import datetime, timedelta
from typing import List

from app.queries.base import BaseChartAdapter


class DentwebAdapter(BaseChartAdapter):
    """덴트웹 전자차트 어댑터"""

    @property
    def chart_type(self) -> str:
        return "dentweb"

    @property
    def required_tables(self) -> List[str]:
        return [
            "Doctor",
            "Patient",
            "Receipt",
            "ReceiptDetail",
            "Treatment",
        ]

    def doctor_performance(self, start_date: str, end_date: str) -> str:
        db = self.db
        # 덴트웹: YYYYMMDD → DATETIME 변환 필요
        sd = f"'{start_date[:4]}-{start_date[4:6]}-{start_date[6:8]}'"
        ed = f"'{end_date[:4]}-{end_date[4:6]}-{end_date[6:8]} 23:59:59'"
        return f"""
        SELECT
            d.DoctorID AS staff_id,
            d.DoctorName AS doctor_name,
            d.Specialty AS specialty,
            ISNULL(v.new_patients, 0) AS new_patients,
            ISNULL(v.old_patients, 0) AS old_patients,
            ISNULL(v.total_visits, 0) AS total_visits,
            ISNULL(v.distinct_patients, 0) AS distinct_patients,
            CASE WHEN ISNULL(v.distinct_patients, 0) > 0
                THEN ROUND(CAST(ISNULL(v.total_visits, 0) AS FLOAT) / v.distinct_patients, 2)
                ELSE 0 END AS avg_visits,
            ISNULL(r.total_revenue, 0) AS total_revenue,
            ISNULL(r.corp_fee, 0) AS corp_fee,
            ISNULL(r.total_payment, 0) AS total_payment,
            0 AS new_patient_count_9m,
            0 AS new_patient_revenue_9m
        FROM {db}.dbo.Doctor d WITH (NOLOCK)
        LEFT JOIN (
            SELECT
                DoctorID,
                COUNT(CASE WHEN IsNewPatient = 1 THEN PatientID END) AS new_patients,
                COUNT(CASE WHEN IsNewPatient = 0 THEN PatientID END) AS old_patients,
                COUNT(PatientID) AS total_visits,
                COUNT(DISTINCT PatientID) AS distinct_patients
            FROM {db}.dbo.Receipt WITH (NOLOCK)
            WHERE ReceiptDate BETWEEN {sd} AND {ed}
            GROUP BY DoctorID
        ) v ON v.DoctorID = d.DoctorID
        LEFT JOIN (
            SELECT
                rc.DoctorID,
                SUM(ISNULL(rd.CardAmount, 0) + ISNULL(rd.CashAmount, 0)
                    + ISNULL(rd.CashReceiptAmount, 0) + ISNULL(rd.OnlineAmount, 0)) AS total_payment,
                SUM(ISNULL(rd.CardAmount, 0) + ISNULL(rd.CashAmount, 0)
                    + ISNULL(rd.CashReceiptAmount, 0) + ISNULL(rd.OnlineAmount, 0))
                + SUM(ISNULL(rd.InsuranceAmount, 0)) AS total_revenue,
                SUM(ISNULL(rd.InsuranceAmount, 0)) AS corp_fee
            FROM {db}.dbo.Receipt rc WITH (NOLOCK)
            INNER JOIN {db}.dbo.ReceiptDetail rd WITH (NOLOCK)
                ON rc.ReceiptID = rd.ReceiptID
            WHERE rc.ReceiptDate BETWEEN {sd} AND {ed}
            GROUP BY rc.DoctorID
        ) r ON r.DoctorID = d.DoctorID
        WHERE d.IsActive = 1
        ORDER BY r.total_revenue DESC
        """

    def payment_summary(self, start_date: str, end_date: str) -> str:
        db = self.db
        sd = f"'{start_date[:4]}-{start_date[4:6]}-{start_date[6:8]}'"
        ed = f"'{end_date[:4]}-{end_date[4:6]}-{end_date[6:8]} 23:59:59'"
        return f"""
        SELECT
            SUM(ISNULL(rd.CardAmount, 0)) AS card_total,
            SUM(ISNULL(rd.CashAmount, 0)) AS cash_total,
            SUM(ISNULL(rd.CashReceiptAmount, 0)) AS cash_receipt_total,
            SUM(ISNULL(rd.OnlineAmount, 0)) AS online_total,
            SUM(ISNULL(rd.InsuranceAmount, 0)) AS corp_fee_total,
            COUNT(DISTINCT rc.PatientID) AS total_patients
        FROM {db}.dbo.Receipt rc WITH (NOLOCK)
        INNER JOIN {db}.dbo.ReceiptDetail rd WITH (NOLOCK)
            ON rc.ReceiptID = rd.ReceiptID
        WHERE rc.ReceiptDate BETWEEN {sd} AND {ed}
        """

    def daily_revenue_trend(self, start_date: str, end_date: str) -> str:
        db = self.db
        sd = f"'{start_date[:4]}-{start_date[4:6]}-{start_date[6:8]}'"
        ed = f"'{end_date[:4]}-{end_date[4:6]}-{end_date[6:8]} 23:59:59'"
        return f"""
        SELECT
            CONVERT(VARCHAR(8), rc.ReceiptDate, 112) AS revenue_date,
            SUM(ISNULL(rd.CardAmount, 0) + ISNULL(rd.CashAmount, 0)
                + ISNULL(rd.CashReceiptAmount, 0) + ISNULL(rd.OnlineAmount, 0)) AS total_payment,
            SUM(ISNULL(rd.InsuranceAmount, 0)) AS corp_fee,
            COUNT(DISTINCT rc.PatientID) AS patient_count
        FROM {db}.dbo.Receipt rc WITH (NOLOCK)
        INNER JOIN {db}.dbo.ReceiptDetail rd WITH (NOLOCK)
            ON rc.ReceiptID = rd.ReceiptID
        WHERE rc.ReceiptDate BETWEEN {sd} AND {ed}
        GROUP BY CONVERT(VARCHAR(8), rc.ReceiptDate, 112)
        ORDER BY revenue_date
        """

    def turnaway_patients(self, months_back: int = 6) -> str:
        db = self.db
        cutoff = (datetime.now() - timedelta(days=30 * months_back)).strftime("%Y-%m-%d")
        return f"""
        SELECT
            rc.PatientID AS pnt_id,
            rc.DoctorID AS doct_id,
            d.DoctorName AS doctor_name,
            p.PatientName AS pnt_name,
            MAX(rc.ReceiptDate) AS last_visit_date,
            DATEDIFF(DAY, MAX(rc.ReceiptDate), GETDATE()) AS days_since_visit
        FROM {db}.dbo.Receipt rc WITH (NOLOCK)
        LEFT JOIN {db}.dbo.Patient p WITH (NOLOCK) ON rc.PatientID = p.PatientID
        LEFT JOIN {db}.dbo.Doctor d WITH (NOLOCK) ON rc.DoctorID = d.DoctorID
        WHERE rc.ReceiptDate >= '{cutoff}'
        GROUP BY rc.PatientID, rc.DoctorID, d.DoctorName, p.PatientName
        HAVING DATEDIFF(DAY, MAX(rc.ReceiptDate), GETDATE()) >= 30
            AND rc.PatientID NOT IN (
                SELECT DISTINCT PatientID
                FROM {db}.dbo.Reservation WITH (NOLOCK)
                WHERE ReservationDate >= CAST(GETDATE() AS DATE)
            )
        ORDER BY days_since_visit DESC
        """

    def lost_patients_ext_to_impl(self) -> str:
        db = self.db
        return f"""
        ;WITH extractions AS (
            SELECT
                t.PatientID AS patient_id,
                t.ToothNumber AS tooth_number,
                t.TreatmentDate AS treatment_date,
                p.PatientName AS pnt_name
            FROM {db}.dbo.Treatment t WITH (NOLOCK)
            LEFT JOIN {db}.dbo.Patient p WITH (NOLOCK) ON t.PatientID = p.PatientID
            WHERE t.TreatmentCode LIKE '%EXT%'
                AND t.ToothNumber NOT IN (18, 28, 38, 48)
                AND t.TreatmentDate >= DATEADD(YEAR, -1, GETDATE())
        ),
        followups AS (
            SELECT DISTINCT PatientID AS patient_id, ToothNumber AS tooth_number
            FROM {db}.dbo.Treatment WITH (NOLOCK)
            WHERE (TreatmentCode LIKE '%IMP%' OR TreatmentCode LIKE '%BR%'
                   OR TreatmentCode LIKE '%IMPL%' OR TreatmentCode LIKE '%BRIDGE%')
        )
        SELECT
            e.patient_id,
            e.pnt_name,
            e.tooth_number,
            CONVERT(VARCHAR(8), e.treatment_date, 112) AS extraction_date,
            DATEDIFF(DAY, e.treatment_date, GETDATE()) AS days_since_extraction
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
                t.PatientID AS patient_id,
                t.ToothNumber AS tooth_number,
                t.TreatmentDate AS treatment_date,
                p.PatientName AS pnt_name
            FROM {db}.dbo.Treatment t WITH (NOLOCK)
            LEFT JOIN {db}.dbo.Patient p WITH (NOLOCK) ON t.PatientID = p.PatientID
            WHERE (t.TreatmentCode LIKE '%ENDO%' OR t.TreatmentCode LIKE '%RCT%')
                AND t.TreatmentDate >= DATEADD(YEAR, -1, GETDATE())
        ),
        crowns AS (
            SELECT DISTINCT PatientID AS patient_id, ToothNumber AS tooth_number
            FROM {db}.dbo.Treatment WITH (NOLOCK)
            WHERE (TreatmentCode LIKE '%CR%' OR TreatmentCode LIKE '%CROWN%')
        )
        SELECT
            e.patient_id,
            e.pnt_name,
            e.tooth_number,
            CONVERT(VARCHAR(8), e.treatment_date, 112) AS endo_date,
            DATEDIFF(DAY, e.treatment_date, GETDATE()) AS days_since_endo
        FROM endos e
        LEFT JOIN crowns c ON e.patient_id = c.patient_id AND e.tooth_number = c.tooth_number
        WHERE c.patient_id IS NULL
        ORDER BY e.treatment_date ASC
        """

    def new_patient_analysis(self, start_date: str, end_date: str) -> str:
        db = self.db
        sd = f"'{start_date[:4]}-{start_date[4:6]}-{start_date[6:8]}'"
        ed = f"'{end_date[:4]}-{end_date[4:6]}-{end_date[6:8]} 23:59:59'"
        return f"""
        SELECT
            p.PatientID AS pnt_id,
            CONVERT(VARCHAR(8), p.RegistrationDate, 112) AS registration_date,
            p.Gender AS gender,
            DATEDIFF(YEAR, p.BirthDate, GETDATE()) AS age,
            fv.DoctorID AS first_doctor_id,
            d.DoctorName AS first_doctor_name,
            ISNULL(pay.total_payment, 0) AS total_payment,
            ISNULL(vis.visit_count, 0) AS visit_count,
            vis.last_visit_date,
            DATEDIFF(DAY, p.RegistrationDate, vis.last_visit_date) AS duration_days
        FROM {db}.dbo.Patient p WITH (NOLOCK)
        OUTER APPLY (
            SELECT TOP 1 DoctorID
            FROM {db}.dbo.Receipt WITH (NOLOCK)
            WHERE PatientID = p.PatientID
            ORDER BY ReceiptDate ASC
        ) fv
        LEFT JOIN {db}.dbo.Doctor d WITH (NOLOCK) ON fv.DoctorID = d.DoctorID
        LEFT JOIN (
            SELECT
                PatientID,
                SUM(ISNULL(rd.CardAmount, 0) + ISNULL(rd.CashAmount, 0)
                    + ISNULL(rd.CashReceiptAmount, 0) + ISNULL(rd.OnlineAmount, 0)) AS total_payment
            FROM {db}.dbo.Receipt rc WITH (NOLOCK)
            INNER JOIN {db}.dbo.ReceiptDetail rd WITH (NOLOCK) ON rc.ReceiptID = rd.ReceiptID
            GROUP BY PatientID
        ) pay ON pay.PatientID = p.PatientID
        LEFT JOIN (
            SELECT
                PatientID,
                COUNT(*) AS visit_count,
                MAX(ReceiptDate) AS last_visit_date
            FROM {db}.dbo.Receipt WITH (NOLOCK)
            GROUP BY PatientID
        ) vis ON vis.PatientID = p.PatientID
        WHERE p.RegistrationDate BETWEEN {sd} AND {ed}
        ORDER BY p.RegistrationDate DESC
        """

    def dashboard_overview(self, start_date: str, end_date: str) -> str:
        db = self.db
        sd = f"'{start_date[:4]}-{start_date[4:6]}-{start_date[6:8]}'"
        ed = f"'{end_date[:4]}-{end_date[4:6]}-{end_date[6:8]} 23:59:59'"
        return f"""
        SELECT
            COUNT(DISTINCT CASE WHEN rc.IsNewPatient = 1 THEN rc.PatientID END) AS total_new_patients,
            COUNT(rc.ReceiptID) AS total_visits,
            COUNT(DISTINCT rc.PatientID) AS total_distinct_patients,
            (SELECT COUNT(*) FROM {db}.dbo.Doctor WITH (NOLOCK) WHERE IsActive = 1) AS active_doctors,
            ISNULL((
                SELECT SUM(ISNULL(rd.CardAmount, 0) + ISNULL(rd.CashAmount, 0)
                    + ISNULL(rd.CashReceiptAmount, 0) + ISNULL(rd.OnlineAmount, 0))
                FROM {db}.dbo.Receipt r2 WITH (NOLOCK)
                INNER JOIN {db}.dbo.ReceiptDetail rd WITH (NOLOCK) ON r2.ReceiptID = rd.ReceiptID
                WHERE r2.ReceiptDate BETWEEN {sd} AND {ed}
            ), 0) AS total_payment,
            ISNULL((
                SELECT SUM(ISNULL(rd.InsuranceAmount, 0))
                FROM {db}.dbo.Receipt r3 WITH (NOLOCK)
                INNER JOIN {db}.dbo.ReceiptDetail rd WITH (NOLOCK) ON r3.ReceiptID = rd.ReceiptID
                WHERE r3.ReceiptDate BETWEEN {sd} AND {ed}
            ), 0) AS total_corp_fee
        FROM {db}.dbo.Receipt rc WITH (NOLOCK)
        WHERE rc.ReceiptDate BETWEEN {sd} AND {ed}
        """
