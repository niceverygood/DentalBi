/**
 * 수납 관리 페이지
 * KPI 6개 + 일별 수납 스택 바 + 수납 구성비 파이
 */
"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { DollarSign } from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import { useDashboardData } from "@/hooks/useAPI";
import { fmtWon, fmt } from "@/lib/format";
import { CHART_TOOLTIP_STYLE } from "@/lib/constants";

export default function RevenuePage() {
  const { paymentData } = useDashboardData();

  // 수납 방법별 합계
  const totals = useMemo(() => {
    const card = paymentData.reduce((s, d) => s + d.card, 0);
    const cash = paymentData.reduce((s, d) => s + d.cash, 0);
    const cashReceipt = paymentData.reduce((s, d) => s + d.cashReceipt, 0);
    const online = paymentData.reduce((s, d) => s + d.online, 0);
    const corp = paymentData.reduce((s, d) => s + d.corp, 0);
    const grand = card + cash + cashReceipt + online + corp;
    return { card, cash, cashReceipt, online, corp, grand };
  }, [paymentData]);

  // 파이 차트 데이터
  const pieData = useMemo(() => [
    { name: "카드",       value: totals.card,        color: "#1A56DB" },
    { name: "현금",       value: totals.cash,        color: "#22C55E" },
    { name: "현금영수증", value: totals.cashReceipt,  color: "#8B5CF6" },
    { name: "온라인",     value: totals.online,      color: "#F59E0B" },
    { name: "공단부담금", value: totals.corp,         color: "#0891B2" },
  ], [totals]);

  const pct = (v: number) => Math.round(v / totals.grand * 100) + "%";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard label="총 수납액" value={fmtWon(totals.grand)} trend={6.4} icon={DollarSign} color="blue" />
        <KPICard label="카드 수납" value={fmtWon(totals.card)} sub={pct(totals.card)} icon={DollarSign} color="purple" />
        <KPICard label="현금 수납" value={fmtWon(totals.cash)} sub={pct(totals.cash)} icon={DollarSign} color="green" />
        <KPICard label="현금영수증" value={fmtWon(totals.cashReceipt)} sub={pct(totals.cashReceipt)} icon={DollarSign} color="amber" />
        <KPICard label="온라인" value={fmtWon(totals.online)} sub={pct(totals.online)} icon={DollarSign} color="cyan" />
        <KPICard label="공단부담금" value={fmtWon(totals.corp)} sub={pct(totals.corp)} icon={DollarSign} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 일별 수납 추이 (스택 바) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">일별 수납 추이</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={paymentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={2} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(Number(v))} />
              <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => [fmtWon(Number(v))]} />
              <Bar dataKey="card" stackId="a" fill="#1A56DB" name="카드" />
              <Bar dataKey="cash" stackId="a" fill="#22C55E" name="현금" />
              <Bar dataKey="cashReceipt" stackId="a" fill="#8B5CF6" name="현금영수증" />
              <Bar dataKey="online" stackId="a" fill="#F59E0B" name="온라인" />
              <Bar dataKey="corp" stackId="a" fill="#0891B2" name="공단부담금" radius={[3, 3, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 수납 구성비 (파이) */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">수납 구성비</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
                style={{ fontSize: 11 }}
              >
                {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [fmtWon(Number(v))]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />{d.name}
                </span>
                <span className="font-medium">{fmtWon(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
