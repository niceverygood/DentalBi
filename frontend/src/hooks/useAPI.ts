/**
 * 데모 데이터를 사용하는 커스텀 훅
 * API 연동 전 fallback으로 demoData.ts의 데이터를 사용
 * TODO: Phase 2에서 실제 API 호출로 교체
 */
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  genMonthlyData, genDoctorStats, genPaymentData, genTxMixData,
  genLostPatients, genTurnawayData, genNewPatientByPeriod,
  genChairHeatmap, AI_INSIGHTS, genCallRecords, genCRMStats,
} from "@/lib/demoData";

/** 모든 대시보드 데이터를 한번에 로드하는 훅 */
export function useDashboardData() {
  const [isLoading, setIsLoading] = useState(true);

  // useMemo로 데모 데이터 캐싱 (리렌더링 방지)
  const monthlyData = useMemo(() => genMonthlyData(), []);
  const doctorStats = useMemo(() => genDoctorStats(), []);
  const paymentData = useMemo(() => genPaymentData(), []);
  const txMixData = useMemo(() => genTxMixData(), []);
  const lostPatients = useMemo(() => genLostPatients(), []);
  const turnawayData = useMemo(() => genTurnawayData(), []);
  const newPtByPeriod = useMemo(() => genNewPatientByPeriod(), []);
  const chairHeatmap = useMemo(() => genChairHeatmap(), []);
  const insights = AI_INSIGHTS;
  const callRecords = useMemo(() => genCallRecords(), []);
  const crmStats = useMemo(() => genCRMStats(), []);

  // 집계 KPI
  const totalRevenue = useMemo(
    () => doctorStats.reduce((s, d) => s + d.totalRevenue, 0),
    [doctorStats]
  );
  const totalNewPt = useMemo(
    () => doctorStats.reduce((s, d) => s + d.newPatients, 0),
    [doctorStats]
  );
  const totalVisits = useMemo(
    () => doctorStats.reduce((s, d) => s + d.totalVisits, 0),
    [doctorStats]
  );
  const totalDistinct = useMemo(
    () => doctorStats.reduce((s, d) => s + d.distinctPatients, 0),
    [doctorStats]
  );
  const avgChairRate = useMemo(
    () => Math.round(doctorStats.reduce((s, d) => s + d.chairOccupancy, 0) / doctorStats.length),
    [doctorStats]
  );
  const lostPtCount = useMemo(
    () => lostPatients.filter(p => p.riskScore >= 70).length,
    [lostPatients]
  );

  useEffect(() => {
    // 실제 API 호출을 시뮬레이션 (로딩 상태 표시)
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  return {
    isLoading,
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
  };
}
