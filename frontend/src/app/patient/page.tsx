/**
 * 환자 포털 홈
 * 환영 메시지 + 다음 예약 + 알림
 */
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Calendar, FileText, Clock, AlertCircle, ChevronRight } from "lucide-react";
import { DEMO_PATIENT, genPatientAppointments, genTreatmentRecords } from "@/lib/patientDemoData";

export default function PatientHomePage() {
  const appointments = useMemo(() => genPatientAppointments(), []);
  const records = useMemo(() => genTreatmentRecords(), []);

  // 다음 예약 (가장 가까운 upcoming)
  const nextAppointment = appointments.find(a => a.status === "upcoming");
  // 진행 중인 진료
  const inProgressRecords = records.filter(r => r.status === "in_progress");

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const weekday = weekdays[d.getDay()];
    const hour = d.getHours();
    const min = d.getMinutes().toString().padStart(2, "0");
    return month + "월 " + day + "일(" + weekday + ") " + hour + ":" + min;
  };

  const daysUntil = (iso: string) => {
    const diff = new Date(iso).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 환영 메시지 */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: "#1E293B" }}>
          {DEMO_PATIENT.maskedName}님, 안녕하세요
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#94A3B8" }}>{DEMO_PATIENT.clinicName}</p>
      </div>

      {/* 다음 예약 카드 */}
      {nextAppointment && (
        <Link href="/patient/appointments">
          <div className="rounded-2xl p-5 text-white" style={{ backgroundColor: "#1A56DB" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium opacity-80">다음 예약</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                {daysUntil(nextAppointment.datetime) === 0 ? "오늘" : daysUntil(nextAppointment.datetime) + "일 후"}
              </span>
            </div>
            <div className="text-lg font-bold mb-1">{nextAppointment.treatment}</div>
            <div className="flex items-center gap-2 text-sm opacity-90">
              <Clock size={13} />
              <span>{formatDate(nextAppointment.datetime)}</span>
            </div>
            <div className="text-xs mt-1 opacity-70">{nextAppointment.doctor} 선생님</div>
            {nextAppointment.notes && (
              <div className="mt-3 text-xs p-2.5 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                {nextAppointment.notes}
              </div>
            )}
          </div>
        </Link>
      )}

      {/* 진행 중인 진료 알림 */}
      {inProgressRecords.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold" style={{ color: "#1E293B" }}>진행 중인 치료</h2>
          {inProgressRecords.map(record => (
            <Link key={record.id} href="/patient/records">
              <div className="bg-white rounded-xl p-4 flex items-center gap-3" style={{ border: "1px solid #E2E8F0" }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FEF3C7" }}>
                  <AlertCircle size={16} style={{ color: "#F59E0B" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: "#1E293B" }}>{record.treatment}</div>
                  <div className="text-xs" style={{ color: "#94A3B8" }}>
                    {record.toothNumber && record.toothNumber + " · "}{record.doctor} 선생님
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: "#CBD5E1" }} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 빠른 메뉴 */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/patient/appointments">
          <div className="bg-white rounded-xl p-4 text-center" style={{ border: "1px solid #E2E8F0" }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: "#EFF6FF" }}>
              <Calendar size={18} style={{ color: "#1A56DB" }} />
            </div>
            <div className="text-sm font-medium" style={{ color: "#1E293B" }}>예약 확인</div>
            <div className="text-xs" style={{ color: "#94A3B8" }}>
              {appointments.filter(a => a.status === "upcoming").length}건 예정
            </div>
          </div>
        </Link>
        <Link href="/patient/records">
          <div className="bg-white rounded-xl p-4 text-center" style={{ border: "1px solid #E2E8F0" }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: "#EFF6FF" }}>
              <FileText size={18} style={{ color: "#1A56DB" }} />
            </div>
            <div className="text-sm font-medium" style={{ color: "#1E293B" }}>진료 기록</div>
            <div className="text-xs" style={{ color: "#94A3B8" }}>
              AI 분석 포함
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
