/**
 * 신환 분석 페이지
 * KPI 4개 + 내원기간별 누적수납 + 초진/진료의사 비교 + 월별 추이
 */
"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart,
} from "recharts";
import { UserPlus, Users, DollarSign, TrendingUp } from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import { useDashboardData } from "@/hooks/useAPI";
import { fmtWon, fmt } from "@/lib/format";
import { CHART_TOOLTIP_STYLE } from "@/lib/constants";

export default function NewPatientsPage() {
  const { doctorStats, monthlyData, newPtByPeriod, totalNewPt } = useDashboardData();

  // 초진/진료의사 비교 데이터
  const doctorCompare = useMemo(
    () => doctorStats.map(d => ({
      name: d.name,
      초진기준: Math.round(d.newRevenue9m * 0.7),
      진료기준: d.newRevenue9m,
    })),
    [doctorStats]
  );

  // 월별 신환 + 평균 진료비 조합 데이터
  const monthlyNewPt = useMemo(
    () => monthlyData.map((m, i) => ({
      ...m,
      avgRevPerNew: Math.round((100 + i * 8 + Math.random() * 20) * 10) / 10,
    })),
    [monthlyData]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="이번달 신환" value={totalNewPt + "명"} trend={12.5} icon={UserPlus} color="blue" />
        <KPICard label="일평균 신환" value={Math.round(totalNewPt / 22) + "명"} icon={Users} color="green" />
        <KPICard label="신환당 평균수익" value="142만원" trend={8.3} sub="9개월 누적" icon={DollarSign} color="purple" />
        <KPICard label="신환 수익비중" value="42.1%" trend={3.2} icon={TrendingUp} color="amber" />
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 내원기간별 누적수납 */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-1">신환 내원기간별 누적수납</h3>
          <p className="text-xs text-gray-400 mb-4">신환 초진일 이후 기간별 평균 수납액 추이</p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={newPtByPeriod}>
              <defs>
                <linearGradient id="gNp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (Number(v) / 10000).toFixed(0) + "만"} />
              <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => [Number(v).toLocaleString() + "원"]} />
              <Area type="monotone" dataKey="payments" stroke="#8B5CF6" strokeWidth={2.5} fill="url(#gNp)" name="누적수납액" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 초진/진료의사별 수납 비교 */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-1">초진/진료의사별 신환 수납</h3>
          <p className="text-xs text-gray-400 mb-4">초진 의사 기준 vs 실제 진료 의사 기준 수납 비교</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={doctorCompare}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(Number(v))} />
              <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => [fmtWon(Number(v))]} />
              <Bar dataKey="초진기준" fill="#93c5fd" radius={[3, 3, 0, 0]} />
              <Bar dataKey="진료기준" fill="#1A56DB" radius={[3, 3, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 월별 신환 수 + 평균 진료비 */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">월별 신환 수 및 평균 진료비 누계</h3>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={monthlyNewPt}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => fmtWon(Number(v))} />
            <Tooltip {...CHART_TOOLTIP_STYLE} />
            <Bar yAxisId="left" dataKey="newPatients" fill="#c4b5fd" name="신환수" radius={[3, 3, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="avgRevPerNew" stroke="#EF4444" strokeWidth={2} dot={{ fill: "#EF4444", r: 3 }} name="평균진료비누계(만원)" />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
