/**
 * 대시보드 데이터 훅 — 실제 API 호출 + 데모 데이터 fallback
 * MSSQL 연결이 없거나 API 실패 시 자동으로 데모 데이터 사용
 */
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  getDashboardOverview,
  getDoctorPerformance,
  getPaymentBreakdown,
  getDailyRevenueTrend,
  getTurnawayPatients,
  getLostPatientsExt,
  getLostPatientsEndo,
  getNewPatientAnalysis,
} from "@/lib/api";
import {
  genMonthlyData, genDoctorStats, genPaymentData, genTxMixData,
  genLostPatients, genTurnawayData, genNewPatientByPeriod,
  genChairHeatmap, AI_INSIGHTS, genCallRecords, genCRMStats,
} from "@/lib/demoData";

/** 모든 대시보드 데이터를 한번에 로드하는 훅 */
export function useDashboardData(period = "month") {
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  // 실제 API 데이터 상태
  const [apiDoctors, setApiDoctors] = useState<any[] | null>(null);
  const [apiOverview, setApiOverview] = useState<any | null>(null);
  const [apiPayment, setApiPayment] = useState<any | null>(null);
  const [apiDailyTrend, setApiDailyTrend] = useState<any[] | null>(null);
  const [apiTurnaway, setApiTurnaway] = useState<any[] | null>(null);
  const [apiLostExt, setApiLostExt] = useState<any[] | null>(null);
  const [apiLostEndo, setApiLostEndo] = useState<any[] | null>(null);
  const [apiNewPatients, setApiNewPatients] = useState<any[] | null>(null);

  // 데모 데이터 (fallback용, 안정적 참조를 위해 useMemo)
  const demoMonthly = useMemo(() => genMonthlyData(), []);
  const demoDoctors = useMemo(() => genDoctorStats(), []);
  const demoPayment = useMemo(() => genPaymentData(), []);
  const demoTxMix = useMemo(() => genTxMixData(), []);
  const demoLost = useMemo(() => genLostPatients(), []);
  const demoTurnaway = useMemo(() => genTurnawayData(), []);
  const demoNewPt = useMemo(() => genNewPatientByPeriod(), []);
  const demoChair = useMemo(() => genChairHeatmap(), []);
  const demoInsights = AI_INSIGHTS;
  const demoCallRecords = useMemo(() => genCallRecords(), []);
  const demoCrmStats = useMemo(() => genCRMStats(), []);

  // API 데이터 fetch
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    let usedDemo = false;

    try {
      // 병렬 API 호출
      const results = await Promise.allSettled([
        getDashboardOverview(period),
        getDoctorPerformance(period),
        getPaymentBreakdown(period),
        getDailyRevenueTrend(period),
        getTurnawayPatients(6),
        getLostPatientsExt(),
        getLostPatientsEndo(),
        getNewPatientAnalysis(period),
      ]);

      const [overview, doctors, payment, daily, turnaway, lostExt, lostEndo, newPt] = results;

      // 개요
      if (overview.status === "fulfilled" && !overview.value.data?.demo) {
        setApiOverview(overview.value.data?.kpi || null);
      } else {
        usedDemo = true;
      }

      // 의사 성과
      if (doctors.status === "fulfilled" && !doctors.value.data?.demo) {
        setApiDoctors(doctors.value.data?.doctors || null);
      } else {
        usedDemo = true;
      }

      // 수납 집계
      if (payment.status === "fulfilled" && !payment.value.data?.demo) {
        setApiPayment(payment.value.data?.breakdown || null);
      } else {
        usedDemo = true;
      }

      // 일별 추이
      if (daily.status === "fulfilled" && !daily.value.data?.demo) {
        setApiDailyTrend(daily.value.data?.daily || null);
      } else {
        usedDemo = true;
      }

      // Turn-away
      if (turnaway.status === "fulfilled" && !turnaway.value.data?.demo) {
        setApiTurnaway(turnaway.value.data?.patients || null);
      } else {
        usedDemo = true;
      }

      // Lost (발치→임플란트)
      if (lostExt.status === "fulfilled" && !lostExt.value.data?.demo) {
        setApiLostExt(lostExt.value.data?.patients || null);
      } else {
        usedDemo = true;
      }

      // Lost (근관→크라운)
      if (lostEndo.status === "fulfilled" && !lostEndo.value.data?.demo) {
        setApiLostEndo(lostEndo.value.data?.patients || null);
      } else {
        usedDemo = true;
      }

      // 신환
      if (newPt.status === "fulfilled" && !newPt.value.data?.demo) {
        setApiNewPatients(newPt.value.data?.patients || null);
      } else {
        usedDemo = true;
      }
    } catch {
      // 전체 실패 시 데모 모드
      usedDemo = true;
    }

    setIsDemo(usedDemo);
    setIsLoading(false);
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 최종 데이터: API 데이터가 있으면 사용, 없으면 데모 fallback
  const doctorStats = apiDoctors || demoDoctors;
  const monthlyData = demoMonthly; // 월별 추이는 아직 API 없음
  const paymentData = apiPayment ? [{
    card: apiPayment.card_total || 0,
    cash: apiPayment.cash_total || 0,
    cashReceipt: apiPayment.cash_receipt_total || 0,
    online: apiPayment.online_total || 0,
    corpFee: apiPayment.corp_fee_total || 0,
  }] : demoPayment;
  const txMixData = demoTxMix; // TxMix는 아직 API 없음
  const turnawayData = apiTurnaway || demoTurnaway;
  const chairHeatmap = demoChair; // 체어 히트맵은 아직 API 없음
  const insights = demoInsights; // AI 인사이트는 별도 페이지에서 호출
  const callRecords = demoCallRecords;
  const crmStats = demoCrmStats;

  // Lost Patients 병합
  const lostPatients = useMemo(() => {
    if (apiLostExt || apiLostEndo) {
      const ext = (apiLostExt || []).map((p: any) => ({
        ...p, riskType: "ext_to_impl",
        riskScore: Math.min(100, 50 + (p.days_since_extraction || 0) / 3),
      }));
      const endo = (apiLostEndo || []).map((p: any) => ({
        ...p, riskType: "endo_to_crown",
        riskScore: Math.min(100, 50 + (p.days_since_endo || 0) / 3),
      }));
      return [...ext, ...endo].sort((a, b) => b.riskScore - a.riskScore);
    }
    return demoLost;
  }, [apiLostExt, apiLostEndo, demoLost]);

  // 신환 데이터
  const newPtByPeriod = apiNewPatients || demoNewPt;

  // 집계 KPI
  const totalRevenue = useMemo(() => {
    if (apiOverview) return apiOverview.total_revenue || 0;
    return doctorStats.reduce((s: number, d: any) => s + (d.totalRevenue || d.total_revenue || 0), 0);
  }, [apiOverview, doctorStats]);

  const totalNewPt = useMemo(() => {
    if (apiOverview) return apiOverview.total_new_patients || 0;
    return doctorStats.reduce((s: number, d: any) => s + (d.newPatients || d.new_patients || 0), 0);
  }, [apiOverview, doctorStats]);

  const totalVisits = useMemo(() => {
    if (apiOverview) return apiOverview.total_visits || 0;
    return doctorStats.reduce((s: number, d: any) => s + (d.totalVisits || d.total_visits || 0), 0);
  }, [apiOverview, doctorStats]);

  const totalDistinct = useMemo(() => {
    if (apiOverview) return apiOverview.total_distinct_patients || 0;
    return doctorStats.reduce((s: number, d: any) => s + (d.distinctPatients || d.distinct_patients || 0), 0);
  }, [apiOverview, doctorStats]);

  const avgChairRate = useMemo(() => {
    if (demoDoctors.length > 0) {
      return Math.round(demoDoctors.reduce((s: number, d: any) => s + (d.chairOccupancy || 0), 0) / demoDoctors.length);
    }
    return 0;
  }, [demoDoctors]);

  const lostPtCount = useMemo(
    () => lostPatients.filter((p: any) => (p.riskScore || p.risk_score || 0) >= 70).length,
    [lostPatients]
  );

  return {
    isLoading,
    isDemo,
    monthlyData,
    doctorStats,
    paymentData,
    txMixData,
    lostPatients,
    turnawayData,
    newPtByPeriod,
    chairHeatmap,
    insights,
    callRecords,
    crmStats,
    // 집계 KPI
    totalRevenue,
    totalNewPt,
    totalVisits,
    totalDistinct,
    avgChairRate,
    lostPtCount,
    // 리프레시
    refetch: fetchData,
  };
}
