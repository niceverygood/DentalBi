/**
 * 환자 진료내역 + AI 분석 페이지
 * 타임라인 형태 + 카드 클릭 시 AI 분석 펼침
 */
"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Sparkles, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { genTreatmentRecords } from "@/lib/patientDemoData";
import type { TreatmentRecord } from "@/lib/patientDemoData";

export default function PatientRecordsPage() {
  const records = useMemo(() => genTreatmentRecords(), []);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggle = (id: number) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return (d.getMonth() + 1) + "월 " + d.getDate() + "일";
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-lg font-bold" style={{ color: "#1E293B" }}>진료 기록</h1>
        <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>AI가 진료 내용을 쉽게 설명해드립니다</p>
      </div>

      {/* 타임라인 */}
      <div className="space-y-3">
        {records.map((record) => {
          const isExpanded = expandedId === record.id;
          const isInProgress = record.status === "in_progress";

          return (
            <div key={record.id}>
              {/* 진료 카드 */}
              <button
                onClick={() => toggle(record.id)}
                className="w-full text-left bg-white rounded-xl p-4 transition-all"
                style={{
                  border: "1px solid " + (isInProgress ? "#1A56DB" : "#E2E8F0"),
                  borderLeft: "3px solid " + (isInProgress ? "#1A56DB" : "#E2E8F0"),
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isInProgress
                        ? <Clock size={12} style={{ color: "#1A56DB" }} />
                        : <CheckCircle size={12} style={{ color: "#22C55E" }} />
                      }
                      <span className="text-xs" style={{ color: isInProgress ? "#1A56DB" : "#94A3B8" }}>
                        {formatDate(record.date)}
                      </span>
                      {record.toothNumber && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "#F1F5F9", color: "#64748B" }}>
                          {record.toothNumber}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-sm" style={{ color: "#1E293B" }}>{record.treatment}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{record.doctor} 선생님</div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Sparkles size={12} style={{ color: "#1A56DB" }} />
                    <span className="text-[10px]" style={{ color: "#1A56DB" }}>AI 분석</span>
                    {isExpanded
                      ? <ChevronUp size={14} style={{ color: "#94A3B8" }} />
                      : <ChevronDown size={14} style={{ color: "#94A3B8" }} />
                    }
                  </div>
                </div>
              </button>

              {/* AI 분석 펼침 */}
              {isExpanded && (
                <div className="mt-1 rounded-xl p-4 space-y-3" style={{ backgroundColor: "#EFF6FF", border: "1px solid #DBEAFE" }}>
                  {/* AI 쉬운 설명 */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles size={13} style={{ color: "#1A56DB" }} />
                      <span className="text-xs font-semibold" style={{ color: "#1A56DB" }}>AI가 쉽게 설명해드려요</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "#1E293B" }}>
                      {record.aiExplanation}
                    </p>
                  </div>

                  {/* 주의사항 */}
                  {record.nextSteps && record.nextSteps.length > 0 && (
                    <div className="bg-white rounded-lg p-3" style={{ border: "1px solid #E2E8F0" }}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <AlertTriangle size={12} style={{ color: "#F59E0B" }} />
                        <span className="text-xs font-semibold" style={{ color: "#92400E" }}>주의사항 / 다음 단계</span>
                      </div>
                      <ul className="space-y-1.5">
                        {record.nextSteps.map((step, i) => (
                          <li key={i} className="text-xs flex items-start gap-2" style={{ color: "#64748B" }}>
                            <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>
                              {i + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
