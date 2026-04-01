/**
 * 의사별 성과 분석 페이지
 * 성과 카드 + 수익 비교 BarChart + 역량 레이더 + 상세 KPI 테이블
 */
"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, Legend,
} from "recharts";
import { useDashboardData } from "@/hooks/useAPI";
import { fmtWon, fmt } from "@/lib/format";
import { CHART_TOOLTIP_STYLE } from "@/lib/constants";

export default function DoctorsPage() {
  const { doctorStats, totalRevenue, totalNewPt, totalVisits, totalDistinct } = useDashboardData();

  // 수익 기준 정렬
  const sorted = useMemo(
    () => [...doctorStats].sort((a, b) => b.totalRevenue - a.totalRevenue),
    [doctorStats]
  );

  // 레이더 차트 데이터
  const radarData = useMemo(() => {
    const subjects = ["수익", "신환", "내원횟수", "체어점유", "분당수익"];
    return subjects.map((subject) => {
      const entry: Record<string, string | number> = { subject };
      sorted.forEach((d) => {
        const values: Record<string, number> = {
          수익: Math.round(d.totalRevenue / 50),
          신환: d.newPatients,
          내원횟수: Math.round(d.avgVisitCount * 30),
          체어점유: d.chairOccupancy,
          분당수익: Math.round(d.revenuePerMin / 50),
        };
        entry[d.name] = values[subject] || 0;
      });
      return entry;
    });
  }, [sorted]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 의사별 성과 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {sorted.map((d) => (
          <div key={d.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: d.color }}>
                {d.name[0]}
              </div>
              <div>
                <div className="font-semibold text-sm">{d.name}</div>
                <div className="text-xs text-gray-400">{d.role}</div>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">총수익</span><span className="font-bold text-gray-900">{fmtWon(d.totalRevenue)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">신환</span><span className="font-semibold">{d.newPatients}명</span></div>
              <div className="flex justify-between"><span className="text-gray-500">총환자</span><span>{d.distinctPatients}명</span></div>
              <div className="flex justify-between"><span className="text-gray-500">평균내원</span><span>{d.avgVisitCount}회</span></div>
              <div className="flex justify-between"><span className="text-gray-500">체어점유</span><span>{d.chairOccupancy}%</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 의사별 수익 비교 */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">의사별 수익 비교</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sorted} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(Number(v))} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={60} />
              <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => [fmtWon(Number(v))]} />
              <Bar dataKey="totalRevenue" name="총수익" radius={[0, 4, 4, 0]}>
                {sorted.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 역량 레이더 */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">의사별 역량 레이더</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              {sorted.slice(0, 3).map((d) => (
                <Radar key={d.id} name={d.name} dataKey={d.name} stroke={d.color} fill={d.color} fillOpacity={0.1} strokeWidth={2} />
              ))}
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 상세 KPI 테이블 */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-gray-900">의사별 상세 KPI 테이블</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 text-left">의사</th>
                <th className="px-4 py-3 text-right">총수익</th>
                <th className="px-4 py-3 text-right">공단부담금</th>
                <th className="px-4 py-3 text-right">총수납</th>
                <th className="px-4 py-3 text-right">신환수</th>
                <th className="px-4 py-3 text-right">구환건수</th>
                <th className="px-4 py-3 text-right">총진료건</th>
                <th className="px-4 py-3 text-right">총환자수</th>
                <th className="px-4 py-3 text-right">평균내원</th>
                <th className="px-4 py-3 text-right">신환당수익</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d, i) => (
                <tr key={d.id} className={`border-b border-gray-50 hover:bg-blue-50/30 ${i === 0 ? "bg-blue-50/20" : ""}`}>
                  <td className="px-4 py-3 font-medium flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />{d.name}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{fmtWon(d.totalRevenue)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{fmtWon(d.corpFee)}</td>
                  <td className="px-4 py-3 text-right">{fmtWon(d.totalPayment)}</td>
                  <td className="px-4 py-3 text-right text-blue-600 font-semibold">{d.newPatients}</td>
                  <td className="px-4 py-3 text-right">{d.oldVisits}</td>
                  <td className="px-4 py-3 text-right">{d.totalVisits}</td>
                  <td className="px-4 py-3 text-right">{d.distinctPatients}</td>
                  <td className="px-4 py-3 text-right">{d.avgVisitCount}회</td>
                  <td className="px-4 py-3 text-right font-semibold">{fmtWon(d.revenuePerNewPt)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold text-sm">
                <td className="px-4 py-3">합계</td>
                <td className="px-4 py-3 text-right">{fmtWon(totalRevenue)}</td>
                <td className="px-4 py-3 text-right text-gray-500">{fmtWon(sorted.reduce((s, d) => s + d.corpFee, 0))}</td>
                <td className="px-4 py-3 text-right">{fmtWon(sorted.reduce((s, d) => s + d.totalPayment, 0))}</td>
                <td className="px-4 py-3 text-right text-blue-600">{totalNewPt}</td>
                <td className="px-4 py-3 text-right">{sorted.reduce((s, d) => s + d.oldVisits, 0)}</td>
                <td className="px-4 py-3 text-right">{totalVisits}</td>
                <td className="px-4 py-3 text-right">{totalDistinct}</td>
                <td className="px-4 py-3 text-right">{(sorted.reduce((s, d) => s + d.avgVisitCount, 0) / sorted.length).toFixed(2)}회</td>
                <td className="px-4 py-3 text-right">{fmtWon(Math.round(sorted.reduce((s, d) => s + d.revenuePerNewPt, 0) / sorted.length))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
