/**
 * 덴비(DenBI) 데모 데이터 생성
 * DentalBI.jsx의 모든 gen* 함수를 TypeScript로 이관
 * DB 미연결 시 fallback 데이터로 사용
 */
import { DOCTORS } from "./constants";
import type {
  DoctorStats, MonthlyTrend, PaymentDay, TxMixItem,
  LostPatient, TurnawayMonth, NewPatientByPeriod,
  ChairHeatmapCell, AIInsight, CallRecord, CRMStats,
} from "@/types";

/** 월별 수익 추이 데이터 생성 */
export function genMonthlyData(): MonthlyTrend[] {
  const months = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
  return months.map((m, i) => ({
    month: m,
    revenue: Math.round((7000 + Math.random() * 4000 + (i > 8 ? -500 : 0)) * 10) / 10,
    insurance: Math.round((2000 + Math.random() * 1500) * 10) / 10,
    newPatients: Math.round(55 + Math.random() * 40 + (i === 0 ? 15 : 0)),
    oldPatients: Math.round(350 + Math.random() * 150),
    totalPatients: Math.round(200 + Math.random() * 80),
    avgVisits: Math.round((1.8 + Math.random() * 0.6) * 100) / 100,
    corpFee: Math.round((1500 + Math.random() * 800) * 10) / 10,
  }));
}

/** 의사별 성과 데이터 생성 */
export function genDoctorStats(): DoctorStats[] {
  return DOCTORS.map(d => ({
    ...d,
    totalRevenue: Math.round(1200 + Math.random() * 3800),
    corpFee: Math.round(400 + Math.random() * 600),
    totalPayment: Math.round(800 + Math.random() * 3200),
    newPatients: Math.round(8 + Math.random() * 35),
    oldVisits: Math.round(80 + Math.random() * 200),
    totalVisits: Math.round(100 + Math.random() * 230),
    distinctPatients: Math.round(70 + Math.random() * 150),
    avgVisitCount: Math.round((1.5 + Math.random() * 1) * 100) / 100,
    newRevenue9m: Math.round(500 + Math.random() * 2000),
    revenuePerNewPt: Math.round(50 + Math.random() * 150),
    chairOccupancy: Math.round(40 + Math.random() * 50),
    revenuePerMin: Math.round(2000 + Math.random() * 4000),
  }));
}

/** 일별 수납 데이터 생성 */
export function genPaymentData(): PaymentDay[] {
  const days: PaymentDay[] = [];
  for (let i = 1; i <= 28; i++) {
    days.push({
      day: `3/${i}`,
      card: Math.round(200 + Math.random() * 300),
      cash: Math.round(30 + Math.random() * 80),
      cashReceipt: Math.round(10 + Math.random() * 40),
      online: Math.round(5 + Math.random() * 30),
      corpFee: Math.round(100 + Math.random() * 150),
    });
  }
  return days;
}

/** TxMix 진료내역 데이터 */
export function genTxMixData(): TxMixItem[] {
  return [
    { category: "임플란트",   count: 48,  revenue: 4320, prevCount: 42,  color: "#1A56DB" },
    { category: "크라운",     count: 67,  revenue: 1675, prevCount: 72,  color: "#8B5CF6" },
    { category: "브릿지",     count: 12,  revenue: 540,  prevCount: 15,  color: "#22C55E" },
    { category: "근관치료",   count: 89,  revenue: 890,  prevCount: 85,  color: "#F59E0B" },
    { category: "발치(단순)", count: 124, revenue: 372,  prevCount: 118, color: "#EF4444" },
    { category: "매복발치",   count: 31,  revenue: 310,  prevCount: 28,  color: "#0891B2" },
    { category: "스케일링",   count: 198, revenue: 594,  prevCount: 190, color: "#4F46E5" },
    { category: "레진충전",   count: 156, revenue: 780,  prevCount: 148, color: "#EC4899" },
    { category: "교정(월)",   count: 22,  revenue: 660,  prevCount: 22,  color: "#14B8A6" },
    { category: "미백",       count: 8,   revenue: 240,  prevCount: 6,   color: "#F97316" },
  ];
}

/** Lost Patient 데이터 (PII 마스킹 처리) */
export function genLostPatients(): LostPatient[] {
  return [
    { id: "P1456", name: "한**", lastVisit: "2025-11-05", pendingTx: "보철 인상 후 세팅 미내원",           riskScore: 95, doctor: "이원장", phone: "010-****-8801", daysAway: 143 },
    { id: "P0412", name: "김**", lastVisit: "2026-01-15", pendingTx: "발치 후 임플란트 미진행 (#36)",      riskScore: 92, doctor: "김원장", phone: "010-****-3421", daysAway: 72 },
    { id: "P1287", name: "이**", lastVisit: "2026-02-03", pendingTx: "근관치료 후 크라운 미진행 (#26)",    riskScore: 87, doctor: "이원장", phone: "010-****-7812", daysAway: 53 },
    { id: "P0891", name: "박**", lastVisit: "2025-12-20", pendingTx: "발치 후 브릿지 미진행 (#45,46)",     riskScore: 85, doctor: "박원장", phone: "010-****-5567", daysAway: 98 },
    { id: "P2034", name: "최**", lastVisit: "2026-01-28", pendingTx: "임플란트 2차수술 미내원",            riskScore: 78, doctor: "김원장", phone: "010-****-9034", daysAway: 59 },
    { id: "P0567", name: "정**", lastVisit: "2026-02-10", pendingTx: "교정 월 체크 미내원 (2개월)",        riskScore: 74, doctor: "최원장", phone: "010-****-2290", daysAway: 46 },
    { id: "P0723", name: "윤**", lastVisit: "2026-01-02", pendingTx: "발치 후 임플란트 상담 후 미내원",    riskScore: 68, doctor: "박원장", phone: "010-****-1155", daysAway: 85 },
    { id: "P1890", name: "조**", lastVisit: "2026-02-22", pendingTx: "스케일링 후 잇몸치료 미진행",        riskScore: 55, doctor: "정원장", phone: "010-****-4478", daysAway: 34 },
  ];
}

/** Turn-away 월별 추이 */
export function genTurnawayData(): TurnawayMonth[] {
  return [
    { month: "10월", count: 42, contacted: 28, returned: 12 },
    { month: "11월", count: 38, contacted: 30, returned: 15 },
    { month: "12월", count: 55, contacted: 35, returned: 14 },
    { month: "1월",  count: 48, contacted: 32, returned: 16 },
    { month: "2월",  count: 35, contacted: 28, returned: 13 },
    { month: "3월",  count: 29, contacted: 18, returned: 8 },
  ];
}

/** 신환 내원기간별 누적수납 */
export function genNewPatientByPeriod(): NewPatientByPeriod[] {
  return [
    { period: "초진일",     payments: 82500,  count: 65 },
    { period: "2~9일",      payments: 156000, count: 48 },
    { period: "10~19일",    payments: 234000, count: 42 },
    { period: "20~29일",    payments: 312000, count: 38 },
    { period: "30~59일",    payments: 445000, count: 35 },
    { period: "60~89일",    payments: 520000, count: 30 },
    { period: "90~119일",   payments: 580000, count: 25 },
    { period: "120~179일",  payments: 620000, count: 20 },
    { period: "180~269일",  payments: 650000, count: 15 },
    { period: "270~364일",  payments: 670000, count: 10 },
  ];
}

/** 체어 히트맵 데이터 생성 */
export function genChairHeatmap(): ChairHeatmapCell[] {
  const hours = ["09","10","11","12","13","14","15","16","17","18"];
  const days = ["월","화","수","목","금","토"];
  const data: ChairHeatmapCell[] = [];
  days.forEach(day => {
    hours.forEach(hour => {
      const isLunch = hour === "12" || hour === "13";
      const isSat = day === "토";
      const base = isLunch ? 30 : (isSat && parseInt(hour) > 13 ? 0 : 60);
      data.push({
        day,
        hour,
        rate: Math.min(100, Math.max(0, base + Math.round(Math.random() * 40))),
      });
    });
  });
  return data;
}

/** CRM 통화 기록 데모 데이터 */
export function genCallRecords(): CallRecord[] {
  return [
    {
      id: 1,
      patientName: "한**",
      staffName: "데스크 김",
      phoneNumber: "010-****-8801",
      direction: "outbound",
      status: "completed",
      duration: 185,
      callResult: "appointment",
      aiSummary: {
        summary: "환자에게 보철 세팅 미내원 건으로 연락. 환자는 업무가 바빠서 못 왔다고 하며, 다음주 수요일 오후 2시에 예약 완료.",
        reason: "리콜",
        outcome: "예약완료",
        next_steps: ["3/12(수) 14:00 예약 확인 문자 발송", "보철물 준비 지시"],
        sentiment: "긍정",
        recommended_result: "appointment",
      },
      notes: "환자 컨디션 좋음. 보철물 미리 준비해둘 것.",
      pendingTx: "보철 인상 후 세팅 미내원",
      riskScore: 95,
      createdAt: "2026-04-04T10:30:00",
    },
    {
      id: 2,
      patientName: "김**",
      staffName: "데스크 박",
      phoneNumber: "010-****-3421",
      direction: "outbound",
      status: "completed",
      duration: 42,
      callResult: "no_answer",
      aiSummary: {
        summary: "전화 3회 시도했으나 부재중. 문자 메시지 남김.",
        reason: "리콜",
        outcome: "부재중",
        next_steps: ["내일 오전 재시도", "카카오 알림톡 발송"],
        sentiment: "불확실",
        recommended_result: "no_answer",
      },
      pendingTx: "발치 후 임플란트 미진행 (#36)",
      riskScore: 92,
      createdAt: "2026-04-04T11:15:00",
    },
    {
      id: 3,
      patientName: "이**",
      staffName: "데스크 김",
      phoneNumber: "010-****-7812",
      direction: "outbound",
      status: "completed",
      duration: 310,
      callResult: "callback",
      aiSummary: {
        summary: "크라운 미진행 건으로 연락. 환자는 비용 부담을 호소하며 보험 적용 여부를 질문. 원장님 상담 후 결정하겠다고 함.",
        reason: "리콜",
        outcome: "콜백예정",
        next_steps: ["이원장에게 상담 요청 전달", "비용 안내 자료 카톡 발송", "4/8 콜백 예정"],
        sentiment: "중립",
        recommended_result: "callback",
      },
      notes: "비용 상담 필요. 분할납부 안내 포함.",
      pendingTx: "근관치료 후 크라운 미진행 (#26)",
      riskScore: 87,
      scheduledCallback: "2026-04-08T14:00:00",
      createdAt: "2026-04-03T15:45:00",
    },
    {
      id: 4,
      patientName: "박**",
      staffName: "데스크 박",
      phoneNumber: "010-****-5567",
      direction: "outbound",
      status: "completed",
      duration: 95,
      callResult: "refused",
      aiSummary: {
        summary: "환자가 다른 치과에서 이미 치료받았다고 함. 더이상 연락하지 말아달라고 요청.",
        reason: "리콜",
        outcome: "거부",
        next_steps: ["환자 리콜 목록에서 제외", "이탈 사유 기록"],
        sentiment: "부정",
        recommended_result: "refused",
      },
      notes: "타원 전환. 리콜 제외 처리.",
      pendingTx: "발치 후 브릿지 미진행 (#45,46)",
      riskScore: 85,
      createdAt: "2026-04-03T10:20:00",
    },
    {
      id: 5,
      patientName: "최**",
      staffName: "데스크 김",
      phoneNumber: "010-****-9034",
      direction: "outbound",
      status: "completed",
      duration: 220,
      callResult: "appointment",
      aiSummary: {
        summary: "임플란트 2차수술 미내원 건 연락. 환자는 수술 두려움으로 미루고 있었다고 함. 원장님이 걱정 없다고 말씀드리겠다고 안내 후 예약 완료.",
        reason: "리콜",
        outcome: "예약완료",
        next_steps: ["4/10(목) 10:00 예약", "수술 안내문 카톡 발송", "김원장에게 환자 불안감 전달"],
        sentiment: "긍정",
        recommended_result: "appointment",
      },
      pendingTx: "임플란트 2차수술 미내원",
      riskScore: 78,
      createdAt: "2026-04-02T14:00:00",
    },
    {
      id: 6,
      patientName: "정**",
      staffName: "데스크 박",
      phoneNumber: "010-****-2290",
      direction: "inbound",
      status: "completed",
      duration: 130,
      callResult: "appointment",
      aiSummary: {
        summary: "환자가 직접 전화하여 교정 체크 예약 문의. 이번 주 토요일 가능 여부 확인 후 예약 완료.",
        reason: "예약확인",
        outcome: "예약완료",
        next_steps: ["4/5(토) 11:00 교정 체크 예약"],
        sentiment: "긍정",
        recommended_result: "appointment",
      },
      pendingTx: "교정 월 체크 미내원 (2개월)",
      riskScore: 74,
      createdAt: "2026-04-02T09:30:00",
    },
  ];
}

/** CRM 통계 데모 데이터 */
export function genCRMStats(): CRMStats {
  return {
    totalCallsToday: 8,
    contactRate: 72.5,
    callbacksScheduled: 3,
    successfulRecalls: 4,
    totalCallsPeriod: 47,
    avgDuration: 156,
  };
}

/** 예약 캘린더 데모 데이터 — 이번 주 기준 */
export function genAppointments(): import("@/types").Appointment[] {
  // 이번 주 월요일 구하기
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const iso = (dayOffset: number, hour: number, min: number = 0) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, min, 0, 0);
    return d.toISOString();
  };

  return [
    { id: 1, patientName: "한**", type: "appointment", datetime: iso(2, 14, 0), durationMin: 60, treatment: "보철 세팅", staffName: "김원장", callRecordId: 1 },
    { id: 2, patientName: "최**", type: "appointment", datetime: iso(3, 10, 0), durationMin: 90, treatment: "임플란트 2차수술", staffName: "김원장", callRecordId: 5 },
    { id: 3, patientName: "이**", type: "callback", datetime: iso(1, 14, 0), durationMin: 15, treatment: "크라운 비용 상담", staffName: "데스크 김", notes: "비용 상담 필요", callRecordId: 3 },
    { id: 4, patientName: "정**", type: "appointment", datetime: iso(4, 11, 0), durationMin: 30, treatment: "교정 체크", staffName: "이원장", callRecordId: 6 },
    { id: 5, patientName: "김**", type: "retry", datetime: iso(0, 10, 0), durationMin: 5, treatment: "임플란트 미진행 리콜", staffName: "데스크 박", callRecordId: 2 },
    { id: 6, patientName: "오**", type: "appointment", datetime: iso(0, 15, 30), durationMin: 45, treatment: "사랑니 발치", staffName: "박원장" },
    { id: 7, patientName: "강**", type: "appointment", datetime: iso(1, 10, 0), durationMin: 60, treatment: "임플란트 1차 식립", staffName: "김원장" },
    { id: 8, patientName: "윤**", type: "callback", datetime: iso(3, 15, 0), durationMin: 10, treatment: "레진 재진 안내", staffName: "데스크 김" },
    { id: 9, patientName: "송**", type: "appointment", datetime: iso(2, 10, 30), durationMin: 30, treatment: "스케일링", staffName: "박원장" },
    { id: 10, patientName: "조**", type: "appointment", datetime: iso(4, 14, 0), durationMin: 60, treatment: "크라운 세팅", staffName: "이원장" },
  ];
}

/** AI 인사이트 데모 데이터 */
export const AI_INSIGHTS: AIInsight[] = [
  {
    type: "warning",
    title: "Lost Patient 급증 알림",
    body: "지난 30일간 발치 후 임플란트 미진행 환자가 6명 발생했습니다. 전월 대비 50% 증가. 해당 환자들에게 개별 연락을 권장합니다.",
    impact: "추정 미실현 매출: 5,400만원",
    time: "2시간 전",
    priority: "high",
  },
  {
    type: "insight",
    title: "김원장 신환 전환율 상승",
    body: "김원장의 신환 90일 내 진료수익이 전월 대비 22% 상승했습니다. 초진 상담 시 종합검진 패키지 제안이 효과적인 것으로 분석됩니다.",
    impact: "신환당 평균 수익: 187만원",
    time: "5시간 전",
    priority: "positive",
  },
  {
    type: "warning",
    title: "오후 체어 가동률 저조",
    body: "화/목 오후 3~5시 체어 가동률이 35%로 전체 평균(72%) 대비 현저히 낮습니다. 해당 시간대 예약 유도 프로모션을 검토해보세요.",
    impact: "개선 시 월 추가 매출: 약 800만원",
    time: "1일 전",
    priority: "medium",
  },
  {
    type: "action",
    title: "보험진료 비율 증가 추세",
    body: "보험진료 비율이 3개월 연속 상승하여 현재 38.2%입니다 (전년 동기 34.1%). 비보험 진료 상담 강화가 필요합니다.",
    impact: "비보험 비율 1% 회복 시 월 +120만원",
    time: "1일 전",
    priority: "medium",
  },
  {
    type: "insight",
    title: "크라운 진료 감소 추세",
    body: "근관치료 대비 크라운 진행률이 68%로 업계 평균(82%) 대비 낮습니다. 근관치료 완료 시 크라운 필요성 설명 프로세스를 강화하세요.",
    impact: "개선 시 월 추가 매출: 약 400만원",
    time: "2일 전",
    priority: "medium",
  },
];
