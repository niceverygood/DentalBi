/**
 * 진료내역(TxMix) 분석 페이지
 * KPI 4개 + 항목별 건수/수익 가로 바 + 상세 테이블
 */
"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Target, DollarSign, Star, TrendingUp } from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import { useDashboardData } from "@/hooks/useAPI";
import { fmtWon } from "@/lib/format";
import { CHART_TOOLTIP_STYLE } from "@/lib/constants";

export default function TxMixPage() {
  const { txMixData } = useDashboardData();

  const totalCount = useMemo(() => txMixData.reduce((s, d) => s + d.count, 0), [txMixData]);
  const totalRev = useMemo(() => txMixData.reduce((s, d) => s + d.revenue, 0), [txMixData]);
  const sortedByRevenue = useMemo(() => [...txMixData].sort((a, b) => b.revenue - a.revenue), [txMixData]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="총 진료건수" value={totalCount + "건"} trend={5.2} icon={Target} color="blue" />
        <KPICard label="총 진료수익" value={fmtWon(totalRev)} trend={7.8} icon={DollarSign} color="green" />
        <KPICard label="임플란트" value={txMixData[0].count + "건"} trend={Math.round((txMixData[0].count / txMixData[0].prevCount - 1) * 100)} icon={Star} color="purple" />
        <KPICard label="건당 평균수익" value={fmtWon(Math.round(totalRev / totalCount))} icon={TrendingUp} color="amber" />
      </div>

      {/* 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 항목별 건수 */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">진료항목별 건수</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={txMixData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={75} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Bar dataKey="count" name="이번 달" radius={[0, 4, 4, 0]}>
                {txMixData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
              <Bar dataKey="prevCount" name="전월" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 항목별 수익 */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">진료항목별 수익</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={sortedByRevenue} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => fmtWon(Number(v))} />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={75} />
              <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => [fmtWon(Number(v))]} />
              <Bar dataKey="revenue" name="수익(만원)" radius={[0, 4, 4, 0]}>
                {sortedByRevenue.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 상세 테이블 */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-gray-900">TxMix 상세 (1월 사업장 현황신고용)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500">
                <th className="px-4 py-3 text-left">진료항목</th>
                <th className="px-4 py-3 text-right">건수</th>
                <th className="px-4 py-3 text-right">전월</th>
                <th className="px-4 py-3 text-right">증감</th>
                <th className="px-4 py-3 text-right">수익(만원)</th>
                <th className="px-4 py-3 text-right">건당수익</th>
                <th className="px-4 py-3 text-right">비중</th>
              </tr>
            </thead>
            <tbody>
              {txMixData.map((d) => {
                const diff = d.count - d.prevCount;
                return (
                  <tr key={d.category} className="border-b border-gray-50 hover:bg-blue-50/30">
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />{d.category}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{d.count}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{d.prevCount}</td>
                    <td className={`px-4 py-3 text-right font-medium ${diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-500" : "text-gray-400"}`}>
                      {diff > 0 ? "+" : ""}{diff}
                    </td>
                    <td className="px-4 py-3 text-right">{fmtWon(d.revenue)}</td>
                    <td className="px-4 py-3 text-right">{fmtWon(Math.round(d.revenue / d.count))}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{Math.round(d.revenue / totalRev * 100)}%</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td className="px-4 py-3">합계</td>
                <td className="px-4 py-3 text-right">{totalCount}</td>
                <td className="px-4 py-3 text-right text-gray-400">{txMixData.reduce((s, d) => s + d.prevCount, 0)}</td>
                <td className="px-4 py-3 text-right text-emerald-600">+{totalCount - txMixData.reduce((s, d) => s + d.prevCount, 0)}</td>
                <td className="px-4 py-3 text-right">{fmtWon(totalRev)}</td>
                <td className="px-4 py-3 text-right">{fmtWon(Math.round(totalRev / totalCount))}</td>
                <td className="px-4 py-3 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
