/**
 * 덴비(DenBI) API 클라이언트
 * axios 인스턴스 + 인터셉터 설정
 * 401 에러 시 /login으로 리다이렉트
 */
import axios from "axios";
import Cookies from "js-cookie";

/** API 기본 URL (환경변수 또는 프록시 사용) */
const baseURL = process.env.NEXT_PUBLIC_API_URL || "";

/** axios 인스턴스 */
const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ─── 요청 인터셉터: JWT 토큰 첨부 ───
api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── 응답 인터셉터: 401 시 로그인 리다이렉트 ───
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 → 리프레시 시도
      try {
        await api.post("/api/auth/refresh");
        return api.request(error.config);
      } catch {
        // 리프레시도 실패 → 로그인 페이지로
        Cookies.remove("access_token");
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════
// API 엔드포인트 함수
// ═══════════════════════════════════════

/** 대시보드 개요 */
export async function getDashboardOverview(period = "month") {
  return api.get("/api/dashboard/overview", { params: { period } });
}

/** 의사별 성과 */
export async function getDoctorPerformance(period = "month") {
  return api.get("/api/doctors/performance", { params: { period } });
}

/** 수납 방법별 집계 */
export async function getPaymentBreakdown(period = "month") {
  return api.get("/api/revenue/payment-breakdown", { params: { period } });
}

/** 일별 수익 추이 */
export async function getDailyRevenueTrend(period = "month") {
  return api.get("/api/revenue/daily-trend", { params: { period } });
}

/** Turn-away 환자 */
export async function getTurnawayPatients(months = 6) {
  return api.get("/api/patients/turnaway", { params: { months } });
}

/** Lost Patient (발치→임플란트) */
export async function getLostPatientsExt() {
  return api.get("/api/patients/lost/ext-to-impl");
}

/** Lost Patient (근관→크라운) */
export async function getLostPatientsEndo() {
  return api.get("/api/patients/lost/endo-to-crown");
}

/** 신환 분석 */
export async function getNewPatientAnalysis(period = "month") {
  return api.get("/api/patients/new", { params: { period } });
}

/** AI 인사이트 생성 */
export async function getAIInsights(period = "month") {
  return api.get("/api/insights/generate", { params: { period } });
}

/** DB 연결 테스트 */
export async function testDBConnection(config: {
  host: string; port: number; database: string; user: string; password: string; chart_type: string;
}) {
  return api.post("/api/connection/test", config);
}

/** 서버 헬스 체크 */
export async function healthCheck() {
  return api.get("/health");
}

export default api;
