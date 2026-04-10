/**
 * 환자 전용 로그인 페이지
 * 전화번호 + 생년월일 간이 인증
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Cake } from "lucide-react";

export default function PatientLoginPage() {
  const [phone, setPhone] = useState("");
  const [birth, setBirth] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    if (!phone || !birth) {
      setError("전화번호와 생년월일을 입력해주세요");
      return;
    }
    // 데모: 어떤 입력이든 로그인 허용
    localStorage.setItem("patientLoggedIn", "true");
    router.push("/patient");
  };

  const handleDemoLogin = () => {
    setPhone("010-1234-8801");
    setBirth("900612");
    localStorage.setItem("patientLoggedIn", "true");
    router.push("/patient");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#F8FAFC" }}>
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="덴비" width={48} height={48} className="mx-auto mb-3 rounded-xl" />
          <h1 className="text-2xl font-bold" style={{ color: "#1A56DB" }}>내 치과 기록</h1>
          <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>아나플란트치과</p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white rounded-2xl p-6 space-y-4" style={{ border: "1px solid #E2E8F0" }}>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "#1E293B" }}>전화번호</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full pl-9 pr-3 py-3 text-sm rounded-xl focus:outline-none focus:ring-2"
                style={{ border: "1px solid #E2E8F0" }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "#1E293B" }}>생년월일 (6자리)</label>
            <div className="relative">
              <Cake size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
              <input
                type="text"
                value={birth}
                onChange={e => setBirth(e.target.value)}
                placeholder="예: 900612"
                maxLength={6}
                className="w-full pl-9 pr-3 py-3 text-sm rounded-xl focus:outline-none focus:ring-2"
                style={{ border: "1px solid #E2E8F0" }}
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-colors"
            style={{ backgroundColor: "#1A56DB" }}
          >
            로그인
          </button>
        </div>

        {/* 데모 로그인 */}
        <button
          onClick={handleDemoLogin}
          className="mt-4 w-full py-3 rounded-xl text-sm font-medium border-2 border-dashed"
          style={{ borderColor: "#E2E8F0", color: "#1A56DB", backgroundColor: "#EFF6FF" }}
        >
          데모 환자로 로그인
        </button>

        <p className="text-center text-[10px] mt-6" style={{ color: "#CBD5E1" }}>
          덴비 환자 포털 &middot; 개인정보는 안전하게 보호됩니다
        </p>
      </div>
    </div>
  );
}
