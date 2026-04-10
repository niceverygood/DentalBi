/**
 * CRM 통화관리 페이지
 * 통화 이력 목록 + KPI + 상세 패널
 */
"use client";

import { useState, useMemo } from "react";
import {
  Phone, PhoneIncoming, PhoneOutgoing, Clock, CheckCircle,
  PhoneOff, CalendarClock, Search, X, ChevronDown, List, Calendar,
} from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import { CallResultBadge } from "@/components/crm/CallResultBadge";
import { CallSummaryCard } from "@/components/crm/CallSummaryCard";
import AppointmentCalendar from "@/components/crm/AppointmentCalendar";
import { genCallRecords, genCRMStats, genAppointments } from "@/lib/demoData";
import type { CallRecord } from "@/types";

export default function CRMPage() {
  const callRecords = useMemo(() => genCallRecords(), []);
  const stats = useMemo(() => genCRMStats(), []);
  const appointments = useMemo(() => genAppointments(), []);

  const [activeTab, setActiveTab] = useState<"calls" | "calendar">("calls");
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [filterResult, setFilterResult] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // 필터링
  const filteredCalls = useMemo(() => {
    let result = callRecords;
    if (filterResult) {
      result = result.filter(c => c.callResult === filterResult);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.patientName?.toLowerCase().includes(q) ||
        c.staffName?.toLowerCase().includes(q) ||
        c.notes?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [callRecords, filterResult, searchQuery]);

  /** 시간 포맷 */
  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  /** 날짜 포맷 */
  const formatDate = (iso?: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${month}/${day} ${h}:${m}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 슬로건 */}
      <div className="text-sm font-medium italic" style={{ color: "#64748B" }}>
        모든 통화를 기록하고, AI가 정리합니다.
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="오늘 통화" value={stats.totalCallsToday + "건"} sub="발신+수신" icon={Phone} color="blue" />
        <KPICard label="컨택률" value={stats.contactRate + "%"} sub="부재중 제외" icon={CheckCircle} color="green" />
        <KPICard label="콜백 예정" value={stats.callbacksScheduled + "건"} sub="향후 일정" icon={CalendarClock} color="amber" />
        <KPICard label="리콜 성공" value={stats.successfulRecalls + "건"} sub="예약 완료" icon={PhoneIncoming} color="purple" />
      </div>

      {/* 탭 전환 */}
      <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: "#F1F5F9" }}>
        <button
          onClick={() => setActiveTab("calls")}
          className={"flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all " + (activeTab === "calls" ? "bg-white" : "")}
          style={activeTab === "calls" ? { color: "#1A56DB" } : { color: "#64748B" }}
        >
          <List size={14} />
          통화 이력
        </button>
        <button
          onClick={() => setActiveTab("calendar")}
          className={"flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all " + (activeTab === "calendar" ? "bg-white" : "")}
          style={activeTab === "calendar" ? { color: "#1A56DB" } : { color: "#64748B" }}
        >
          <Calendar size={14} />
          예약 캘린더
        </button>
      </div>

      {/* 캘린더 탭 */}
      {activeTab === "calendar" && (
        <AppointmentCalendar appointments={appointments} />
      )}

      {/* 통화 이력 탭 */}
      {activeTab === "calls" && <>
      {/* 필터 바 */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="환자명, 직원명, 메모 검색..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <select
            value={filterResult}
            onChange={e => setFilterResult(e.target.value)}
            className="appearance-none bg-white border border-gray-200 text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 결과</option>
            <option value="appointment">예약완료</option>
            <option value="callback">콜백예정</option>
            <option value="no_answer">부재중</option>
            <option value="refused">거부</option>
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div className="text-xs text-gray-400">
          총 {filteredCalls.length}건
        </div>
      </div>

      <div className="flex gap-6">
        {/* 통화 이력 테이블 */}
        <div className={`bg-white rounded-xl border border-gray-100 overflow-hidden ${selectedCall ? "flex-1" : "w-full"}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500">
                  <th className="px-4 py-3 text-left">일시</th>
                  <th className="px-4 py-3 text-left">환자</th>
                  <th className="px-4 py-3 text-left">담당</th>
                  <th className="px-4 py-3 text-center">방향</th>
                  <th className="px-4 py-3 text-right">통화시간</th>
                  <th className="px-4 py-3 text-center">결과</th>
                  <th className="px-4 py-3 text-left">AI 요약</th>
                </tr>
              </thead>
              <tbody>
                {filteredCalls.map(call => (
                  <tr
                    key={call.id}
                    onClick={() => setSelectedCall(call)}
                    className={`border-b border-gray-50 cursor-pointer transition-colors ${
                      selectedCall?.id === call.id
                        ? "bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(call.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium">{call.patientName}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{call.staffName}</td>
                    <td className="px-4 py-3 text-center">
                      {call.direction === "outbound"
                        ? <PhoneOutgoing size={13} className="inline text-blue-500" />
                        : <PhoneIncoming size={13} className="inline text-green-500" />
                      }
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      <Clock size={11} className="inline mr-1 text-gray-400" />
                      {formatDuration(call.duration)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <CallResultBadge result={call.callResult} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">
                      {call.aiSummary?.summary || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 상세 패널 */}
        {selectedCall && (
          <div className="w-[400px] bg-white rounded-xl border border-gray-100 p-5 space-y-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">통화 상세</h3>
              <button onClick={() => setSelectedCall(null)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            {/* 환자 정보 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">환자</span>
                <span className="font-medium">{selectedCall.patientName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">전화번호</span>
                <span className="text-xs text-gray-600">{selectedCall.phoneNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">담당 직원</span>
                <span className="text-xs">{selectedCall.staffName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">통화시간</span>
                <span className="text-xs">{formatDuration(selectedCall.duration)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">결과</span>
                <CallResultBadge result={selectedCall.callResult} />
              </div>
              {selectedCall.pendingTx && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">미완료 진료</span>
                  <span className="text-xs text-red-600 text-right max-w-[200px]">{selectedCall.pendingTx}</span>
                </div>
              )}
              {selectedCall.scheduledCallback && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">콜백 예정</span>
                  <span className="text-xs text-blue-600">{formatDate(selectedCall.scheduledCallback)}</span>
                </div>
              )}
            </div>

            {/* AI 요약 */}
            {selectedCall.aiSummary && (
              <CallSummaryCard summary={selectedCall.aiSummary} />
            )}

            {/* 직원 메모 */}
            {selectedCall.notes && (
              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                <div className="text-[10px] text-yellow-700 font-medium mb-1">직원 메모</div>
                <p className="text-xs text-yellow-900">{selectedCall.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
      </>}
    </div>
  );
}
