/**
 * 인증 컨텍스트 Provider
 * 전역 인증 상태 관리 — login, logout, register
 * 
 * 동시 로그인 방지:
 * - 로그인 시 고유 session_id 생성 → JWT + 쿠키에 저장
 * - 서버에서 session_id 검증 → 불일치 시 세션 만료 처리
 * - 세션 만료 감지 시 "다른 기기에서 로그인" 알림 + 로그아웃
 * 
 * 테스트 단계: 데모 로그인 지원 (백엔드 미연결 시 자동 로그인)
 */
"use client";

import {
  createContext, useContext, useState, useCallback,
  useEffect, useRef, type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import type { User } from "@/types";

// ═══════════════════════════════════════
// 컨텍스트 타입 정의
// ═══════════════════════════════════════
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionId: string | null;
  isSessionKicked: boolean;       // 다른 기기에서 로그인되어 만료된 경우
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  dismissKickMessage: () => void;  // 세션 만료 알림 닫기
  error: string | null;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  clinicName: string;
  chartType: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ═══════════════════════════════════════
// 유틸: 고유 세션 ID 생성
// ═══════════════════════════════════════
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

// ═══════════════════════════════════════
// 데모 사용자 데이터 (백엔드 미연결 시 사용)
// ═══════════════════════════════════════
const DEMO_USERS: Record<string, User> = {
  "hss@bottlecorp.kr": {
    id: 0, email: "hss@bottlecorp.kr", name: "한승수",
    role: "superadmin", clinicId: 0, clinicName: "BottleCorp",
  },
  "kim@clinic.com": {
    id: 1, email: "kim@clinic.com", name: "김원장",
    role: "owner", clinicId: 1, clinicName: "아나플란트치과",
  },
  "lee@clinic.com": {
    id: 2, email: "lee@clinic.com", name: "이원장",
    role: "admin", clinicId: 1, clinicName: "아나플란트치과",
  },
  "demo@dentalbi.com": {
    id: 99, email: "demo@dentalbi.com", name: "데모계정",
    role: "viewer", clinicId: 1, clinicName: "아나플란트치과",
  },
};

// ═══════════════════════════════════════
// Provider 컴포넌트
// ═══════════════════════════════════════
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionKicked, setIsSessionKicked] = useState(false);
  const sessionCheckRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  /** 세션 저장 헬퍼 */
  const saveSession = (userObj: User, token: string, sid: string) => {
    Cookies.set("access_token", token, { expires: 7 });
    Cookies.set("user_data", JSON.stringify(userObj), { expires: 7 });
    Cookies.set("session_id", sid, { expires: 7 });
    setUser(userObj);
    setSessionId(sid);
    setIsSessionKicked(false);
  };

  /** 세션 클리어 헬퍼 */
  const clearSession = () => {
    Cookies.remove("access_token");
    Cookies.remove("user_data");
    Cookies.remove("session_id");
    setUser(null);
    setSessionId(null);
  };

  /** 앱 시작 시 저장된 세션 복원 */
  useEffect(() => {
    const token = Cookies.get("access_token");
    const savedUser = Cookies.get("user_data");
    const savedSession = Cookies.get("session_id");

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setSessionId(savedSession || null);
      } catch {
        clearSession();
      }
    }
    setIsLoading(false);
  }, []);

  /** 미인증 시 로그인 페이지로 리다이렉트 */
  useEffect(() => {
    if (!isLoading && !user && pathname !== "/login") {
      router.push("/login");
    }
  }, [isLoading, user, pathname, router]);

  /**
   * 세션 유효성 주기적 검증 (백엔드 연결 시)
   * 서버에서 현재 session_id가 유효한지 확인
   * 다른 기기에서 로그인 시 session_id 불일치 → 강제 로그아웃
   */
  useEffect(() => {
    if (!user || !sessionId) return;

    const checkSession = async () => {
      try {
        const token = Cookies.get("access_token");
        if (!token || token.startsWith("demo_token_")) return; // 데모 모드 스킵

        const res = await axios.get("/api/auth/session/validate", {
          headers: { Authorization: `Bearer ${token}` },
          params: { session_id: sessionId },
        });

        if (res.data.valid === false) {
          // 다른 기기에서 로그인 → 세션 만료
          setIsSessionKicked(true);
          clearSession();
          router.push("/login");
        }
      } catch {
        // 서버 미연결 시 무시
      }
    };

    // 30초마다 세션 검증
    sessionCheckRef.current = setInterval(checkSession, 30000);
    return () => {
      if (sessionCheckRef.current) clearInterval(sessionCheckRef.current);
    };
  }, [user, sessionId, router]);

  /** 로그인 */
  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const newSessionId = generateSessionId();

    // 1) 백엔드 API 시도
    try {
      const res = await axios.post("/api/auth/login", {
        email,
        password,
        session_id: newSessionId, // 세션 ID 전달 → 서버에서 이전 세션 무효화
      });
      const { access_token, user: userData } = res.data;
      const userObj: User = {
        id: userData.id, email: userData.email, name: userData.name,
        role: userData.role, clinicId: userData.clinic_id, clinicName: userData.clinic_name,
      };
      saveSession(userObj, access_token, newSessionId);
      router.push("/");
      return;
    } catch {
      // 백엔드 미연결 — 데모 모드 fallback
    }

    // 2) 데모 모드 (테스트용)
    const demoUser = DEMO_USERS[email];
    if (demoUser) {
      saveSession(demoUser, "demo_token_" + Date.now(), newSessionId);
      router.push("/");
      return;
    }

    // 3) 아무 이메일이든 데모 로그인 (테스트 단계)
    const fallbackUser: User = {
      id: 99, email, name: email.split("@")[0],
      role: "owner", clinicId: 1, clinicName: "아나플란트치과",
    };
    saveSession(fallbackUser, "demo_token_" + Date.now(), newSessionId);
    router.push("/");
  }, [router]);

  /** 회원가입 */
  const register = useCallback(async (data: RegisterData) => {
    setError(null);
    const newSessionId = generateSessionId();
    try {
      const res = await axios.post("/api/auth/register", {
        email: data.email, password: data.password,
        name: data.name, clinic_name: data.clinicName, chart_type: data.chartType,
        session_id: newSessionId,
      });
      const { access_token, user: userData } = res.data;
      const userObj: User = {
        id: userData.id, email: userData.email, name: userData.name,
        role: userData.role, clinicId: userData.clinic_id, clinicName: userData.clinic_name,
      };
      saveSession(userObj, access_token, newSessionId);
      router.push("/");
    } catch {
      // 데모 회원가입
      const userObj: User = {
        id: Math.floor(Math.random() * 1000),
        email: data.email, name: data.name,
        role: "owner", clinicId: 99, clinicName: data.clinicName,
      };
      saveSession(userObj, "demo_token_" + Date.now(), newSessionId);
      router.push("/");
    }
  }, [router]);

  /** 로그아웃 */
  const logout = useCallback(() => {
    // 서버에 세션 종료 알림 (백엔드 연결 시)
    const token = Cookies.get("access_token");
    if (token && !token.startsWith("demo_token_")) {
      axios.post("/api/auth/logout", { session_id: sessionId }, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    clearSession();
    router.push("/login");
  }, [router, sessionId]);

  /** 세션 만료 알림 닫기 */
  const dismissKickMessage = useCallback(() => {
    setIsSessionKicked(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isLoading,
      sessionId, isSessionKicked,
      login, register, logout, dismissKickMessage, error,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/** 인증 컨텍스트 사용 훅 */
export function useAuthContext(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
