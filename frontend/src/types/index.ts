/**
 * 덴비(DenBI) 전체 타입 정의
 * DentalBI.jsx의 데이터 구조를 TypeScript interface로 변환
 */

// ═══════════════════════════════════════
// 의사 관련
// ═══════════════════════════════════════

/** 의사 기본 정보 */
export interface Doctor {
  id: number;
  name: string;
  role: string;
  specialty?: string;
  color: string;
}

/** 의사별 상세 성과 지표 (강의 p.72 SQL 기반) */
export interface DoctorStats extends Doctor {
  totalRevenue: number;      // 총수익 (만원)
  corpFee: number;           // 공단부담금 (만원)
  totalPayment: number;      // 총수납 (만원)
  newPatients: number;       // 신환수
  oldVisits: number;         // 구환진료건수
  totalVisits: number;       // 총진료건수
  distinctPatients: number;  // 총환자수 (유니크)
  avgVisitCount: number;     // 평균내원횟수
  newRevenue9m: number;      // 신환수익 (9개월 기준, 만원)
  revenuePerNewPt: number;   // 신환당수익 (만원)
  revenuePerMin: number;     // 진료시간당 수익 (원/분)
  chairOccupancy: number;    // 체어점유율 (%)
}

// ═══════════════════════════════════════
// 월별 데이터
// ═══════════════════════════════════════

/** 월별 수익 추이 데이터 */
export interface MonthlyTrend {
  month: string;
  revenue: number;         // 총수익 (만원)
  insurance: number;       // 보험수익
  newPatients: number;     // 신환수
  oldPatients: number;     // 구환진료건수
  totalPatients: number;   // 총환자수
  avgVisits: number;       // 평균내원횟수
  corpFee: number;         // 공단부담금 (만원)
}

// ═══════════════════════════════════════
// TxMix 진료내역
// ═══════════════════════════════════════

/** 진료내역 구성비 항목 */
export interface TxMixItem {
  category: string;
  count: number;
  revenue: number;      // 만원
  prevCount: number;    // 전월 건수
  color: string;
}

// ═══════════════════════════════════════
// 환자 이탈 관리
// ═══════════════════════════════════════

/** Lost Patient 상세 (진료 중단 환자) */
export interface LostPatient {
  id: string;
  name: string;           // 마스킹 처리 (김**)
  lastVisit: string;      // YYYY-MM-DD
  pendingTx: string;      // 미완료 진료내용
  riskScore: number;      // 이탈 위험도 (0~100)
  doctor: string;
  phone: string;          // 마스킹 처리 (010-****-XXXX)
  daysAway: number;       // 미내원일수
}

/** Turn-away 월별 추이 */
export interface TurnawayMonth {
  month: string;
  count: number;       // 이탈 환자수
  contacted: number;   // 연락 완료
  returned: number;    // 복귀 성공
}

// ═══════════════════════════════════════
// 신환 분석
// ═══════════════════════════════════════

/** 초진의사별/진료의사별 신환 분석 */
export interface NewPatientAnalysis {
  doctor: string;
  asFirst: number;              // 초진기준 수납
  asTreating: number;           // 진료기준 수납
  avgRevenueFirst: number;
  avgRevenueTreating: number;
  conversionRate: number;       // 전환율 (%)
  color: string;
}

/** 신환 내원기간별 누적수납 */
export interface NewPatientByPeriod {
  period: string;
  payments: number;   // 누적수납액 (원)
  count: number;
}

// ═══════════════════════════════════════
// 체어 가동률
// ═══════════════════════════════════════

/** 체어 히트맵 셀 */
export interface ChairHeatmapCell {
  day: string;
  hour: string;
  rate: number;    // 점유율 (%)
}

/** 체어 시간별 지표 */
export interface ChairUtilHour {
  time: string;
  utilization: number;
  patients: number;
}

// ═══════════════════════════════════════
// 수납 관리
// ═══════════════════════════════════════

/** 일별 수납 방법별 데이터 */
export interface PaymentDay {
  day: string;
  card: number;
  cash: number;
  cashReceipt: number;
  online: number;
  corp: number;
}

/** 수납 구성비 파이 데이터 */
export interface PaymentPieItem {
  name: string;
  value: number;
  color: string;
}

// ═══════════════════════════════════════
// AI 인사이트
// ═══════════════════════════════════════

/** AI 생성 인사이트 */
export interface AIInsight {
  type: "warning" | "danger" | "success" | "info" | "insight" | "action";
  title: string;
  body: string;
  impact: string;           // 예: "추정 미실현 매출: 5,400만원"
  time: string;
  priority: "high" | "medium" | "low" | "positive";
}

// ═══════════════════════════════════════
// 인증 / 사용자
// ═══════════════════════════════════════

/** 사용자 정보 */
export interface User {
  id: number;
  email: string;
  name: string;
  role: "superadmin" | "owner" | "admin" | "viewer";
  clinicId: number;
  clinicName?: string;
}

/** 인증 상태 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ═══════════════════════════════════════
// 설정 / DB
// ═══════════════════════════════════════

/** DB 연결 설정 */
export interface DBConfig {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
  chartType: "hanaro" | "dentweb" | "oneclick";
}

/** 날짜 범위 */
export interface DateRange {
  start: string;
  end: string;
  period: "today" | "week" | "month" | "quarter" | "year";
}

// ═══════════════════════════════════════
// 관리자 페이지
// ═══════════════════════════════════════

/** 직원(의사/스태프) 정보 */
export interface StaffMember {
  id: number;
  email: string;
  name: string;
  role: "superadmin" | "owner" | "admin" | "viewer";
  position: string;           // 대표원장 | 부원장 | 진료원장 | 봉직의 | 스태프
  specialty?: string;         // 보철과 | 교정과 등
  phone?: string;
  isDoctor: boolean;
  isActive: boolean;
  licenseNumber?: string;
  clinicId: number;
  createdAt?: string;
  lastLogin?: string;
}

/** 병원 정보 */
export interface ClinicInfo {
  id: number;
  name: string;
  ehrType: string;
  address?: string;
  phone?: string;
  chairCount: number;
  totalStaff: number;
  activeDoctors: number;
  createdAt?: string;
}

// ═══════════════════════════════════════
// CRM 통화 기록
// ═══════════════════════════════════════

/** 통화 기록 */
export interface CallRecord {
  id: number;
  patientName?: string;
  staffName?: string;
  phoneNumber?: string;
  direction: "inbound" | "outbound";
  status: "pending" | "processing" | "completed" | "failed";
  duration: number;              // 초
  callResult?: "appointment" | "callback" | "no_answer" | "refused" | "other";
  aiSummary?: CallSummary;
  notes?: string;
  pendingTx?: string;
  riskScore?: number;
  scheduledCallback?: string;
  createdAt?: string;
}

/** AI 통화 요약 */
export interface CallSummary {
  summary: string;
  reason: string;
  outcome: string;
  next_steps: string[];
  sentiment: string;
  recommended_result?: string;
}

/** CRM 통계 */
export interface CRMStats {
  totalCallsToday: number;
  contactRate: number;           // %
  callbacksScheduled: number;
  successfulRecalls: number;
  totalCallsPeriod: number;
  avgDuration: number;           // 초
}

// ═══════════════════════════════════════
// UI 컴포넌트 Props
// ═══════════════════════════════════════

/** 네비게이션 아이템 */
export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
}

/** DataTable 컬럼 정의 */
export interface Column<T = Record<string, unknown>> {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  render?: (value: unknown, row: T) => React.ReactNode;
}
