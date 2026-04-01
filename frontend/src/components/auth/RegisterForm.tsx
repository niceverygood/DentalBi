/**
 * 회원가입 폼 컴포넌트
 * 치과명 + 이름 + 이메일 + 비밀번호 + 전자차트 종류
 */
"use client";

import { useState, FormEvent } from "react";
import { Loader2 } from "lucide-react";

interface RegisterFormProps {
  onRegister: (data: {
    email: string;
    password: string;
    name: string;
    clinicName: string;
    chartType: string;
  }) => Promise<void>;
  onSwitchToLogin: () => void;
  error?: string | null;
}

export default function RegisterForm({ onRegister, onSwitchToLogin, error }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    clinicName: "",
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
    chartType: "hanaro",
  });
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (formData.password !== formData.passwordConfirm) {
      setLocalError("비밀번호가 일치하지 않습니다");
      return;
    }
    if (formData.password.length < 6) {
      setLocalError("비밀번호는 6자 이상이어야 합니다");
      return;
    }

    setLoading(true);
    try {
      await onRegister({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        clinicName: formData.clinicName,
        chartType: formData.chartType,
      });
    } catch {
      // 에러는 부모에서 처리
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, val: string) =>
    setFormData((prev) => ({ ...prev, [key]: val }));

  const displayError = localError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">치과명</label>
        <input
          type="text"
          value={formData.clinicName}
          onChange={(e) => update("clinicName", e.target.value)}
          placeholder="아나플란트치과"
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="김원장"
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="admin@clinic.com"
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => update("password", e.target.value)}
            placeholder="••••••••"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
          <input
            type="password"
            value={formData.passwordConfirm}
            onChange={(e) => update("passwordConfirm", e.target.value)}
            placeholder="••••••••"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">전자차트 종류</label>
        <select
          value={formData.chartType}
          onChange={(e) => update("chartType", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="hanaro">하나로 3.0</option>
          <option value="dentweb">덴트웹</option>
          <option value="oneclick">원클릭</option>
        </select>
      </div>

      {displayError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
          {displayError}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        회원가입
      </button>

      <p className="text-center text-sm text-gray-500">
        이미 계정이 있으신가요?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          로그인
        </button>
      </p>
    </form>
  );
}
