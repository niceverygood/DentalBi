/**
 * 로그인 페이지 — 덴비(DenBI) 브랜딩
 * Login/Register 탭 전환
 * 인증 시 / 로 리다이렉트
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { useAuthContext } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { login, register, isAuthenticated, error, isSessionKicked, dismissKickMessage } = useAuthContext();
  const router = useRouter();

  // 이미 로그인된 경우 대시보드로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)" }}
    >
      <div className="w-full max-w-md">
        {/* 세션 만료 알림 (다른 기기에서 로그인) */}
        {isSessionKicked && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">다른 기기에서 로그인되었습니다</p>
              <p className="text-xs text-amber-600 mt-0.5">
                보안을 위해 현재 세션이 종료되었습니다. 본인이 아닌 경우 비밀번호를 즉시 변경해주세요.
              </p>
            </div>
            <button onClick={dismissKickMessage} className="text-amber-400 hover:text-amber-600">
              <X size={14} />
            </button>
          </div>
        )}

        {/* 로고 — 덴비 */}
        <div className="text-center mb-8">
          {/* D 심볼 */}
          <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ backgroundColor: "#1A56DB" }}>
            <span className="text-white font-bold text-3xl leading-none">D</span>
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full" style={{ backgroundColor: "#38BDF8" }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>
            덴비 <span className="text-sm font-medium" style={{ color: "#64748B" }}>DenBI</span>
          </h1>
          <p className="text-sm mt-1 italic" style={{ color: "#64748B" }}>AI가 경영을 봅니다</p>
        </div>

        {/* 카드 */}
        <div className="bg-white rounded-2xl shadow-lg border p-8" style={{ borderColor: "#E2E8F0" }}>
          {/* 탭 */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === "login"
                  ? "bg-white shadow-sm"
                  : "hover:text-gray-700"
              }`}
              style={mode === "login" ? { color: "#1A56DB" } : { color: "#64748B" }}
            >
              로그인
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === "register"
                  ? "bg-white shadow-sm"
                  : "hover:text-gray-700"
              }`}
              style={mode === "register" ? { color: "#1A56DB" } : { color: "#64748B" }}
            >
              회원가입
            </button>
          </div>

          {/* 폼 */}
          {mode === "login" ? (
            <LoginForm
              onLogin={login}
              onSwitchToRegister={() => setMode("register")}
              error={error}
            />
          ) : (
            <RegisterForm
              onRegister={register}
              onSwitchToLogin={() => setMode("login")}
              error={error}
            />
          )}
        </div>

        {/* 데모 안내 */}
        <div className="mt-4 bg-white/60 backdrop-blur rounded-xl border p-4" style={{ borderColor: "#E2E8F0" }}>
          <p className="text-xs font-medium mb-2" style={{ color: "#1E293B" }}>🔑 테스트 계정:</p>
          <div className="space-y-1 text-xs" style={{ color: "#64748B" }}>
            <div className="flex justify-between">
              <span>총괄관리자</span>
              <span className="font-mono">hss@bottlecorp.kr</span>
            </div>
            <div className="flex justify-between">
              <span>병원 Owner</span>
              <span className="font-mono">kim@clinic.com</span>
            </div>
            <div className="flex justify-between">
              <span>데모 계정</span>
              <span className="font-mono">아무 이메일 입력</span>
            </div>
          </div>
          <p className="text-[10px] mt-2" style={{ color: "#94A3B8" }}>* 테스트 단계: 비밀번호 아무거나 입력 가능</p>
        </div>

        {/* 하단 슬로건 */}
        <p className="text-center text-xs mt-6" style={{ color: "#94A3B8" }}>
          원장님은 진료에 집중하세요. 경영은 덴비가.
        </p>
        <p className="text-center text-xs mt-1" style={{ color: "#CBD5E1" }}>
          © 2026 DenBI — 서울대 치과경영정보학교실 기반
        </p>
      </div>
    </div>
  );
}
