/**
 * 환자 예약관리 페이지
 * 예정/완료 예약 리스트
 */
"use client";

import { useMemo } from "react";
import { Clock, User, CheckCircle, Calendar } from "lucide-react";
import { genPatientAppointments } from "@/lib/patientDemoData";

export default function PatientAppointmentsPage() {
  const appointments = useMemo(() => genPatientAppointments(), []);
  const upcoming = appointments.filter(a => a.status === "upcoming");
  const past = appointments.filter(a => a.status === "completed");

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const weekday = weekdays[d.getDay()];
    const hour = d.getHours();
    const min = d.getMinutes().toString().padStart(2, "0");
    return month + "/" + day + "(" + weekday + ") " + hour + ":" + min;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-lg font-bold" style={{ color: "#1E293B" }}>예약 관리</h1>

      {/* 예정 예약 */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: "#1A56DB" }}>
          <Calendar size={14} />
          예정된 예약 ({upcoming.length})
        </h2>
        {upcoming.map(apt => (
          <div key={apt.id} className="bg-white rounded-xl p-4 space-y-2" style={{ border: "1px solid #E2E8F0", borderLeft: "3px solid #1A56DB" }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-sm" style={{ color: "#1E293B" }}>{apt.treatment}</div>
                <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "#64748B" }}>
                  <span className="flex items-center gap-1"><Clock size={11} />{formatDate(apt.datetime)}</span>
                  <span className="flex items-center gap-1"><User size={11} />{apt.doctor}</span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#EFF6FF", color: "#1A56DB" }}>
                예정
              </span>
            </div>
            {apt.notes && (
              <div className="text-xs p-2.5 rounded-lg" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>
                {apt.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 지난 예약 */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: "#64748B" }}>
          <CheckCircle size={14} />
          지난 예약 ({past.length})
        </h2>
        {past.map(apt => (
          <div key={apt.id} className="bg-white rounded-xl p-4" style={{ border: "1px solid #E2E8F0" }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium" style={{ color: "#64748B" }}>{apt.treatment}</div>
                <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "#94A3B8" }}>
                  <span className="flex items-center gap-1"><Clock size={11} />{formatDate(apt.datetime)}</span>
                  <span className="flex items-center gap-1"><User size={11} />{apt.doctor}</span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#F1F5F9", color: "#94A3B8" }}>
                완료
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
