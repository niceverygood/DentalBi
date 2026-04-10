/**
 * 종합 현황 (Overview) 페이지
 * KPI 6개 + 월별 수익 + 신환/구환 + AI 인사이트 요약
 */
"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  DollarSign, UserPlus, Activity, Users, Clock, AlertTriangle,
} from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import InsightCard from "@/components/ui/InsightCard";
import { useDashboardData } from "@/hooks/useAPI";
import { fmtWon, fmt } from "@/lib/format";
import { CHART_TOOLTIP_STYLE } from "@/lib/constants";

export default function OverviewPage() {
  const {
    monthlyData, totalRevenue, totalNewPt, totalVisits,
    totalDistinct, avgChairRate, lostPtCount, insights,
  } = useDashboardData();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI 카드 6개 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard label="총 수익" value={fmtWon(totalRevenue)} trend={8.2} sub="전월대비" icon={DollarSign} color="blue" />
        <KPICard label="신환 수" value={totalNewPt + "명"} trend={12.5} sub="전월대비" icon={UserPlus} color="green" />
        <KPICard label="총 진료건수" value={totalVisits.toLocaleString() + "건"} trend={3.1} sub="전월대비" icon={Activity} color="purple" />
        <KPICard label="총 환자수" value={totalDistinct + "명"} trend={5.7} sub="전월대비" icon={Users} color="cyan" />
        <KPICard label="체어 가동률" value={avgChairRate + "%"} trend={-2.3} sub="전월대비" icon={Clock} color="amber" />
        <KPICard label="이탈 위험 환자" value={lostPtCount + "명"} trend={-15} sub="주의 필요" icon={AlertTriangle} color="red" />
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 월별 수익 추이 */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">월별 수익 추이</h3>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" />총수익</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />공단부담금</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1A56DB" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#1A56DB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gCorp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => fmt(Number(v))} />
              <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => [fmtWon(Number(v))]} />
              <Area type="monotone" dataKey="revenue" stroke="#1A56DB" strokeWidth={2} fill="url(#gRev)" name="총수익" />
              <Area type="monotone" dataKey="corpFee" stroke="#22C55E" strokeWidth={2} fill="url(#gCorp)" name="공단부담금" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 월별 신환/구환 */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">월별 신환 / 구환</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Bar dataKey="newPatients" fill="#1A56DB" name="신환" radius={[3, 3, 0, 0]} />
              <Bar dataKey="oldPatients" fill="#E2E8F0" name="구환진료건" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI 인사이트 요약 */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">최근 AI 인사이트</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insights.slice(0, 4).map((ins, i) => (
            <InsightCard key={i} insight={ins} />
          ))}
        </div>
      </div>
    </div>
  );
}
