/**
 * 인증 상태 관리 훅
 * login, register, logout, 토큰 갱신
 * localStorage에 access_token 저장
 */
"use client";

import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import type { User } from "@/types";

interface UseAuth {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  clinicName: string;
  chartType: string;
}

export function useAuth(): UseAuth {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** 앱 시작 시 토큰으로 사용자 정보 복원 */
  useEffect(() => {
    const token = Cookies.get("access_token");
    if (token) {
      fetchUser(token).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  /** /api/auth/me로 사용자 정보 가져오기 */
  const fetchUser = async (token: string) => {
    try {
      const res = await axios.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser({
        id: res.data.id,
        email: res.data.email,
        name: res.data.name,
        role: res.data.role,
        clinicId: res.data.clinic_id,
        clinicName: res.data.clinic_name,
      });
    } catch {
      Cookies.remove("access_token");
      setUser(null);
    }
  };

  /** 로그인 */
  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      const { access_token, user: userData } = res.data;
      Cookies.set("access_token", access_token, { expires: 1 }); // 1일
      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        clinicId: userData.clinic_id,
        clinicName: userData.clinic_name,
      });
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.detail
          ? err.response.data.detail
          : "로그인에 실패했습니다";
      setError(message);
      throw new Error(message);
    }
  }, []);

  /** 회원가입 */
  const register = useCallback(async (data: RegisterData) => {
    setError(null);
    try {
      const res = await axios.post("/api/auth/register", {
        email: data.email,
        password: data.password,
        name: data.name,
        clinic_name: data.clinicName,
        chart_type: data.chartType,
      });
      const { access_token, user: userData } = res.data;
      Cookies.set("access_token", access_token, { expires: 1 });
      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        clinicId: userData.clinic_id,
        clinicName: userData.clinic_name,
      });
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.detail
          ? err.response.data.detail
          : "회원가입에 실패했습니다";
      setError(message);
      throw new Error(message);
    }
  }, []);

  /** 로그아웃 */
  const logout = useCallback(async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch {
      // 서버 연결 실패해도 로컬 클리어
    }
    Cookies.remove("access_token");
    setUser(null);
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    error,
  };
}
