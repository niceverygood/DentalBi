/**
 * 구독/플랜 관련 상수 및 타입 정의
 * 치과 시장 현실적 가격 기반 (개원의 월 매출 5,000~1.5억 기준)
 */

export type PlanTier = "free" | "basic" | "professional" | "enterprise";

export interface PlanFeature {
  name: string;
  free: boolean | string;
  basic: boolean | string;
  professional: boolean | string;
  enterprise: boolean | string;
}

export interface SubscriptionPlan {
  id: PlanTier;
  name: string;
  nameEn: string;
  price: number;           // 월 가격 (원)
  priceAnnual: number;     // 연간 결제 시 월 단가 (원)
  description: string;
  targetClinic: string;    // 권장 대상
  maxChairs: number;       // 최대 체어 수
  maxDoctors: number;      // 최대 의사 수
  maxStaff: number;        // 최대 전체 계정 수
  highlight?: boolean;     // 추천 플랜 여부
  color: string;
  gradient: string;
}

/** 구독 플랜 정의 — 치과 원장 인터뷰/시장조사 기반 */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "무료 체험",
    nameEn: "Free",
    price: 0,
    priceAnnual: 0,
    description: "덴비를 14일간 무료로 체험해보세요",
    targetClinic: "도입 검토 중인 치과",
    maxChairs: 2,
    maxDoctors: 1,
    maxStaff: 2,
    color: "#6b7280",
    gradient: "from-gray-500 to-gray-600",
  },
  {
    id: "basic",
    name: "Basic",
    nameEn: "Basic",
    price: 99000,
    priceAnnual: 79000,
    description: "1인 개원의를 위한 핵심 경영 분석",
    targetClinic: "1인 치과 · 소규모 의원",
    maxChairs: 3,
    maxDoctors: 2,
    maxStaff: 5,
    color: "#1A56DB",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    id: "professional",
    name: "Professional",
    nameEn: "Professional",
    price: 199000,
    priceAnnual: 159000,
    description: "다수 의사 · 성장하는 치과를 위한 종합 분석",
    targetClinic: "3~5인 치과 · 성장기 의원",
    maxChairs: 10,
    maxDoctors: 7,
    maxStaff: 15,
    highlight: true,
    color: "#8B5CF6",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    nameEn: "Enterprise",
    price: 399000,
    priceAnnual: 329000,
    description: "네트워크 · 대형 치과를 위한 맞춤형 솔루션",
    targetClinic: "네트워크 치과 · 대학병원",
    maxChairs: 999,
    maxDoctors: 999,
    maxStaff: 999,
    color: "#22C55E",
    gradient: "from-emerald-500 to-teal-600",
  },
];

/** 티어별 기능 비교표 */
export const PLAN_FEATURES: PlanFeature[] = [
  // ─── 대시보드 ───
  { name: "종합 현황 대시보드",           free: true,           basic: true,          professional: true,           enterprise: true },
  { name: "의사별 성과 분석",              free: false,          basic: true,          professional: true,           enterprise: true },
  { name: "수납 관리 (카드/현금/공단)",     free: "요약만",       basic: true,          professional: true,           enterprise: true },
  { name: "진료내역(TxMix) 분석",          free: false,          basic: true,          professional: true,           enterprise: true },
  // ─── 환자 관리 ───
  { name: "환자 이탈 관리 (Lost Patient)", free: false,          basic: "상위 5명",    professional: true,           enterprise: true },
  { name: "Turn-away Patient 추적",        free: false,          basic: false,         professional: true,           enterprise: true },
  { name: "신환 분석 (초진/진료의사별)",    free: false,          basic: "기본 통계",   professional: true,           enterprise: true },
  // ─── 체어/시간 ───
  { name: "체어 가동률 히트맵",            free: false,          basic: false,         professional: true,           enterprise: true },
  { name: "시간당 수익 분석",              free: false,          basic: false,         professional: true,           enterprise: true },
  // ─── AI 기능 ───
  { name: "AI 인사이트",                   free: false,          basic: "1일 1건",     professional: "무제한",        enterprise: "무제한 + 커스텀" },
  { name: "AI 자연어 질의",                free: false,          basic: false,         professional: true,           enterprise: true },
  { name: "AI 경영 리포트 (PDF)",          free: false,          basic: false,         professional: "월 1회",        enterprise: "주 1회 + 맞춤" },
  // ─── 관리 ───
  { name: "관리자 페이지 (직원 관리)",      free: false,          basic: true,          professional: true,           enterprise: true },
  { name: "다지점 통합 관리",              free: false,          basic: false,         professional: false,          enterprise: true },
  { name: "API 연동 (외부 시스템)",        free: false,          basic: false,         professional: false,          enterprise: true },
  // ─── 지원 ───
  { name: "데이터 보관 기간",              free: "14일",         basic: "1년",         professional: "3년",           enterprise: "무제한" },
  { name: "고객 지원",                     free: "이메일",       basic: "이메일",      professional: "전화 + 이메일", enterprise: "전담 매니저" },
  { name: "초기 설치 지원",                free: false,          basic: "원격",        professional: "방문 설치",      enterprise: "방문 + 교육" },
];
