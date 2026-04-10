/**
 * 주간 예약 캘린더 컴포넌트
 * 예약(appointment), 콜백(callback), 재시도(retry) 일정 표시
 * 외부 라이브러리 없이 직접 구현
 */
"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, User, Phone, RotateCcw, X } from "lucide-react";
import type { Appointment } from "@/types";

interface AppointmentCalendarProps {
  appointments: Appointment[];
}

const DAYS = ["월", "화", "수", "목", "금", "토"];
const START_HOUR = 9;
const END_HOUR = 19;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

/** 주의 월요일 구하기 */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - ((day + 6) % 7);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 날짜 포맷 */
function fmtDate(d: Date): string {
  return (d.getMonth() + 1) + "/" + d.getDate();
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.getHours() + ":" + d.getMinutes().toString().padStart(2, "0");
}

/** 타입별 스타일 */
function getTypeStyle(type: Appointment["type"]) {
  switch (type) {
    case "appointment":
      return { bg: "#EFF6FF", border: "#1A56DB", text: "#1A56DB", label: "예약" };
    case "callback":
      return { bg: "#F8FAFC", border: "#94A3B8", text: "#64748B", label: "콜백" };
    case "retry":
      return { bg: "#FFFBEB", border: "#F59E0B", text: "#92400E", label: "재시도" };
  }
}

function getTypeIcon(type: Appointment["type"]) {
  switch (type) {
    case "appointment": return <User size={10} />;
    case "callback": return <Phone size={10} />;
    case "retry": return <RotateCcw size={10} />;
  }
}

export default function AppointmentCalendar({ appointments }: AppointmentCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<Appointment | null>(null);

  const monday = useMemo(() => {
    const d = getMonday(new Date());
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  // 주간 날짜 배열 (월~토)
  const weekDates = useMemo(() => {
    return DAYS.map((_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [monday]);

  // 오늘 날짜
  const today = new Date();
  const todayStr = today.toDateString();

  // 이번 주 예약만 필터
  const weekAppointments = useMemo(() => {
    const start = new Date(monday);
    const end = new Date(monday);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59);
    return appointments.filter(a => {
      const d = new Date(a.datetime);
      return d >= start && d <= end;
    });
  }, [appointments, monday]);

  // 날짜별 그룹
  const getAptsForDay = (dayIndex: number) => {
    const date = weekDates[dayIndex];
    if (!date) return [];
    return weekAppointments.filter(a => {
      const d = new Date(a.datetime);
      return d.toDateString() === date.toDateString();
    });
  };

  // 예약 블록 위치 계산
  const getBlockStyle = (apt: Appointment) => {
    const d = new Date(apt.datetime);
    const hourOffset = d.getHours() - START_HOUR;
    const minOffset = d.getMinutes() / 60;
    const top = (hourOffset + minOffset) * 60; // 60px per hour
    const height = Math.max((apt.durationMin / 60) * 60, 24);
    return { top: top + "px", height: height + "px" };
  };

  // 주간 라벨
  const weekLabel = useMemo(() => {
    const end = new Date(monday);
    end.setDate(end.getDate() + 5);
    const y = monday.getFullYear();
    const m1 = monday.getMonth() + 1;
    const d1 = monday.getDate();
    const m2 = end.getMonth() + 1;
    const d2 = end.getDate();
    return y + "년 " + m1 + "/" + d1 + " - " + m2 + "/" + d2;
  }, [monday]);

  // 일별 예약 수 합계
  const totalWeek = weekAppointments.length;

  return (
    <div className="space-y-4">
      {/* 캘린더 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: "#64748B" }}
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="text-sm font-semibold" style={{ color: "#1E293B" }}>
            {weekLabel}
          </h3>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: "#64748B" }}
          >
            <ChevronRight size={18} />
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs px-2 py-1 rounded-md"
              style={{ backgroundColor: "#EFF6FF", color: "#1A56DB" }}
            >
              이번 주
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs" style={{ color: "#94A3B8" }}>
          <span>이번 주 {totalWeek}건</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#1A56DB" }} /> 예약
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#94A3B8" }} /> 콜백
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#F59E0B" }} /> 재시도
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
        {/* 요일 헤더 */}
        <div className="grid grid-cols-[60px_repeat(6,1fr)]" style={{ borderBottom: "1px solid #E2E8F0" }}>
          <div className="p-2" />
          {weekDates.map((date, i) => {
            const isToday = date.toDateString() === todayStr;
            return (
              <div
                key={i}
                className="p-2 text-center"
                style={{ borderLeft: "1px solid #E2E8F0" }}
              >
                <div className="text-xs font-medium" style={{ color: isToday ? "#1A56DB" : "#64748B" }}>
                  {DAYS[i]}
                </div>
                <div
                  className={"text-sm font-semibold mt-0.5 " + (isToday ? "w-7 h-7 rounded-full flex items-center justify-center mx-auto text-white" : "")}
                  style={isToday ? { backgroundColor: "#1A56DB" } : { color: "#1E293B" }}
                >
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* 시간 그리드 */}
        <div className="grid grid-cols-[60px_repeat(6,1fr)] relative" style={{ height: (END_HOUR - START_HOUR) * 60 + "px" }}>
          {/* 시간 라벨 */}
          <div className="relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute text-[10px] text-right pr-2 w-full"
                style={{ top: (hour - START_HOUR) * 60 + "px", color: "#94A3B8" }}
              >
                {hour}:00
              </div>
            ))}
          </div>

          {/* 요일 컬럼 */}
          {DAYS.map((_, dayIndex) => {
            const dayApts = getAptsForDay(dayIndex);
            return (
              <div
                key={dayIndex}
                className="relative"
                style={{ borderLeft: "1px solid #E2E8F0" }}
              >
                {/* 시간 가로선 */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full"
                    style={{
                      top: (hour - START_HOUR) * 60 + "px",
                      borderBottom: "1px solid #F1F5F9",
                    }}
                  />
                ))}

                {/* 예약 블록 */}
                {dayApts.map((apt) => {
                  const style = getTypeStyle(apt.type);
                  const pos = getBlockStyle(apt);
                  return (
                    <div
                      key={apt.id}
                      onClick={() => setSelected(apt)}
                      className="absolute left-1 right-1 rounded-md px-1.5 py-1 cursor-pointer overflow-hidden transition-all hover:opacity-80"
                      style={{
                        top: pos.top,
                        height: pos.height,
                        backgroundColor: style.bg,
                        borderLeft: "3px solid " + style.border,
                        zIndex: 10,
                      }}
                    >
                      <div className="flex items-center gap-1" style={{ color: style.text }}>
                        {getTypeIcon(apt.type)}
                        <span className="text-[10px] font-semibold truncate">{apt.patientName}</span>
                      </div>
                      {apt.durationMin >= 30 && (
                        <div className="text-[9px] truncate mt-0.5" style={{ color: style.text, opacity: 0.7 }}>
                          {apt.treatment}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* 현재 시각 표시선 */}
          {weekOffset === 0 && (() => {
            const now = new Date();
            const dayIndex = (now.getDay() + 6) % 7;
            if (dayIndex >= 6) return null;
            const hourOffset = now.getHours() - START_HOUR;
            const minOffset = now.getMinutes() / 60;
            const top = (hourOffset + minOffset) * 60;
            if (top < 0 || top > (END_HOUR - START_HOUR) * 60) return null;
            // 컬럼 위치 계산: 60px(시간) + dayIndex * (100%/6)
            return (
              <div
                className="absolute h-0.5 z-20"
                style={{
                  top: top + "px",
                  left: 60 + dayIndex * ((100 - 0) / 6) + "%",
                  width: (100 / 6) + "%",
                  backgroundColor: "#EF4444",
                }}
              >
                <div className="w-2 h-2 rounded-full -mt-[3px] -ml-1" style={{ backgroundColor: "#EF4444" }} />
              </div>
            );
          })()}
        </div>
      </div>

      {/* 선택된 예약 상세 */}
      {selected && (
        <div className="bg-white rounded-xl p-5 space-y-3" style={{ border: "1px solid #E2E8F0" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded-md text-xs font-medium"
                style={{ backgroundColor: getTypeStyle(selected.type).bg, color: getTypeStyle(selected.type).text }}
              >
                {getTypeStyle(selected.type).label}
              </span>
              <h4 className="font-semibold" style={{ color: "#1E293B" }}>{selected.patientName}</h4>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span style={{ color: "#94A3B8" }}>날짜/시간</span>
              <div style={{ color: "#1E293B" }}>{fmtTime(selected.datetime)} ({selected.durationMin}분)</div>
            </div>
            <div>
              <span style={{ color: "#94A3B8" }}>담당</span>
              <div style={{ color: "#1E293B" }}>{selected.staffName || "-"}</div>
            </div>
            {selected.treatment && (
              <div className="col-span-2">
                <span style={{ color: "#94A3B8" }}>진료 내용</span>
                <div style={{ color: "#1E293B" }}>{selected.treatment}</div>
              </div>
            )}
            {selected.notes && (
              <div className="col-span-2">
                <span style={{ color: "#94A3B8" }}>메모</span>
                <div style={{ color: "#64748B" }}>{selected.notes}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
