/**
 * 환자 이탈 관리 페이지
 * KPI 4개 + Lost Patient 테이블 + Turn-away 추이 + 미완료 진료 파이
 */
"use client";

import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  UserMinus, AlertTriangle, XCircle, DollarSign,
  Phone, MessageSquare,
} from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import { RiskBadge } from "@/components/ui/Badge";
import { useDashboardData } from "@/hooks/useAPI";
import { CHART_TOOLTIP_STYLE } from "@/lib/constants";

export default function PatientsPage() {
  const { lostPatients, turnawayData } = useDashboardData();

  // Lost Patient 위험도 정렬
  const sortedPatients = [...lostPatients].sort((a, b) => b.riskScore - a.riskScore);

  // 미완료 진료 유형별 분포 (파이 데이터)
  const pendingTypeData = [
    { name: "발치→임플란트", value: 3, color: "#EF4444" },
    { name: "근관→크라운",   value: 2, color: "#F59E0B" },
    { name: "보철 세팅",     value: 1, color: "#8B5CF6" },
    { name: "교정 체크",     value: 1, color: "#1A56DB" },
    { name: "잇몸치료",     value: 1, color: "#22C55E" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Lost Patient" value={lostPatients.length + "명"} sub="진료중단 환자" icon={UserMinus} color="red" />
        <KPICard label="고위험 (80+)" value={lostPatients.filter(p => p.riskScore >= 80).length + "명"} sub="즉시 연락 필요" icon={AlertTriangle} color="red" />
        <KPICard label="이번달 Turn-away" value={turnawayData[turnawayData.length - 1].count + "명"} trend={-17} icon={XCircle} color="amber" />
        <KPICard label="추정 미실현 매출" value="9,200만원" sub="Lost Patient 기준" icon={DollarSign} color="purple" />
      </div>

      {/* Lost Patient 테이블 */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Lost Patient 목록 (진료 진행 중 미내원)</h3>
          <div className="flex gap-2">
            <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1">
              <MessageSquare size={12} />일괄 문자발송
            </button>
            <button className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 flex items-center gap-1">
              <Phone size={12} />통화목록 생성
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500">
                <th className="px-4 py-3 text-left">위험도</th>
                <th className="px-4 py-3 text-left">환자</th>
                <th className="px-4 py-3 text-left">미완료 진료내용</th>
                <th className="px-4 py-3 text-left">담당의사</th>
                <th className="px-4 py-3 text-right">미내원일수</th>
                <th className="px-4 py-3 text-right">마지막내원</th>
                <th className="px-4 py-3 text-center">액션</th>
              </tr>
            </thead>
            <tbody>
              {sortedPatients.map((p) => (
                <tr key={p.id} className={`border-b border-gray-50 hover:bg-red-50/20 ${p.riskScore >= 80 ? "bg-red-50/10" : ""}`}>
                  <td className="px-4 py-3"><RiskBadge score={p.riskScore} /></td>
                  <td className="px-4 py-3 font-medium">{p.name} <span className="text-gray-400 text-xs">{p.id}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">{p.pendingTx}</td>
                  <td className="px-4 py-3 text-xs">{p.doctor}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">{p.daysAway}일</td>
                  <td className="px-4 py-3 text-right text-xs text-gray-500">{p.lastVisit}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <button className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"><Phone size={11} /></button>
                      <button className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100"><MessageSquare size={11} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Turn-away 추이 */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Turn-away Patient 추이</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={turnawayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#fca5a5" name="이탈 환자" radius={[3, 3, 0, 0]} />
              <Bar dataKey="contacted" fill="#93c5fd" name="연락 완료" radius={[3, 3, 0, 0]} />
              <Bar dataKey="returned" fill="#86efac" name="복귀 성공" radius={[3, 3, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 미완료 진료 유형 파이 */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">미완료 진료 유형별 분포</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pendingTypeData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name} (${value})`}
                style={{ fontSize: 11 }}
              >
                {pendingTypeData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
