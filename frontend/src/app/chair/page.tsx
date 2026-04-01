/**
 * 체어 가동률 페이지
 * KPI 4개 + 히트맵 + 의사별 시간당수익/체어점유 ComposedChart
 */
"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart,
} from "recharts";
import { Clock, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import { useDashboardData } from "@/hooks/useAPI";
import { CHART_TOOLTIP_STYLE } from "@/lib/constants";

/** 가동률별 색상 매핑 */
const getColor = (rate: number): string => {
  if (rate === 0) return "bg-gray-100 text-gray-400";
  if (rate < 30) return "bg-red-100 text-red-700";
  if (rate < 50) return "bg-amber-100 text-amber-700";
  if (rate < 70) return "bg-yellow-100 text-yellow-700";
  if (rate < 85) return "bg-emerald-100 text-emerald-700";
  return "bg-emerald-200 text-emerald-800";
};

const HOURS = ["09","10","11","12","13","14","15","16","17","18"];
const DAYS = ["월","화","수","목","금","토"];

export default function ChairPage() {
  const { chairHeatmap, doctorStats, avgChairRate } = useDashboardData();

  // 의사별 시간당수익 정렬
  const sortedDoctors = useMemo(
    () => [...doctorStats].sort((a, b) => b.revenuePerMin - a.revenuePerMin),
    [doctorStats]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="평균 가동률" value={avgChairRate + "%"} trend={-2.3} icon={Clock} color="blue" />
        <KPICard label="피크 시간대" value="오전 10~12시" sub="가동률 92%" icon={TrendingUp} color="green" />
        <KPICard label="저조 시간대" value="오후 4~6시" sub="가동률 38%" icon={TrendingDown} color="red" />
        <KPICard label="토요일 가동률" value="61%" trend={5.1} icon={Calendar} color="purple" />
      </div>

      {/* 히트맵 */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-1">체어 가동률 히트맵</h3>
        <p className="text-xs text-gray-400 mb-4">요일/시간대별 체어 점유율 (%)</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-2 py-2 text-xs text-gray-500 w-12"></th>
                {HOURS.map((h) => (
                  <th key={h} className="px-2 py-2 text-xs text-gray-500 text-center">{h}시</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day}>
                  <td className="px-2 py-1 text-xs font-medium text-gray-600">{day}</td>
                  {HOURS.map((hour) => {
                    const cell = chairHeatmap.find(c => c.day === day && c.hour === hour);
                    const rate = cell ? cell.rate : 0;
                    return (
                      <td key={hour} className="px-1 py-1">
                        <div className={`rounded-lg text-center py-3 text-xs font-bold ${getColor(rate)}`}>
                          {rate > 0 ? rate + "%" : "-"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* 범례 */}
        <div className="flex items-center gap-3 mt-4 text-xs text-gray-500">
          <span>범례:</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100" />30% 미만</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100" />30~50%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100" />50~70%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100" />70~85%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-200" />85%+</span>
        </div>
      </div>

      {/* 의사별 시간당수익 / 체어점유율 */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">의사별 진료시간당 수익 / 체어시간 점유율</h3>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={sortedDoctors}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => (Number(v) / 1000).toFixed(0) + "천"} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} unit="%" />
            <Tooltip {...CHART_TOOLTIP_STYLE} />
            <Bar yAxisId="left" dataKey="revenuePerMin" fill="#1A56DB" name="진료시간당수익(원/분)" radius={[3, 3, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="chairOccupancy" stroke="#EF4444" strokeWidth={2} dot={{ fill: "#EF4444", r: 4 }} name="체어점유율(%)" />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
