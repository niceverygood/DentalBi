/**
 * 덴비(DenBI) 상수 정의
 * 차트 색상, 네비게이션 항목, 의사 기본 데이터
 */
import {
  Activity, BarChart3, DollarSign, Target, UserMinus,
  UserPlus, Clock, Brain, Settings, ShieldCheck, Crown,
  PhoneCall,
} from "lucide-react";
import type { Doctor, NavItem } from "@/types";

/** 차트 기본 색상 팔레트 — 강조색 + 회색 계열 */
export const CHART_COLORS = [
  "#1A56DB", "#94A3B8", "#CBD5E1", "#E2E8F0", "#1E293B",
];

/** 파이 차트 색상 */
export const PIE_COLORS = [
  "#1A56DB", "#64748B", "#94A3B8", "#CBD5E1", "#E2E8F0",
];

/** 사이드바 네비게이션 항목 */
export const NAV_ITEMS: NavItem[] = [
  { id: "overview",      label: "종합 현황",        href: "/",              icon: Activity },
  { id: "doctors",       label: "의사별 성과",      href: "/doctors",       icon: BarChart3 },
  { id: "revenue",       label: "수납 관리",        href: "/revenue",       icon: DollarSign },
  { id: "txmix",         label: "진료내역(TxMix)",  href: "/txmix",         icon: Target },
  { id: "patients",      label: "환자 이탈 관리",   href: "/patients",      icon: UserMinus },
  { id: "crm",           label: "CRM 통화관리",    href: "/crm",           icon: PhoneCall },
  { id: "newpatients",   label: "신환 분석",        href: "/newpatients",   icon: UserPlus },
  { id: "chair",         label: "체어 가동률",      href: "/chair",         icon: Clock },
  { id: "insights",      label: "AI 인사이트",      href: "/insights",      icon: Brain },
  { id: "settings",      label: "설정",             href: "/settings",      icon: Settings },
  { id: "admin",         label: "관리자",           href: "/admin",         icon: ShieldCheck },
  // 테스트 단계: 구독 관리 메뉴 숨김 (모든 기능 제한 없이 이용 가능)
  // { id: "subscription",  label: "구독 관리",        href: "/subscription",  icon: Crown },
];

/** 의사 기본 데이터 (데모용) — 강조색 + 회색 계열 */
export const DOCTORS: Doctor[] = [
  { id: 1, name: "김원장", role: "대표원장", color: "#1A56DB" },
  { id: 2, name: "이원장", role: "부원장",   color: "#64748B" },
  { id: 3, name: "박원장", role: "진료원장", color: "#94A3B8" },
  { id: 4, name: "최원장", role: "진료원장", color: "#CBD5E1" },
  { id: 5, name: "정원장", role: "봉직의",   color: "#1E293B" },
];

/** Recharts 공통 툴팁 스타일 */
export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    borderRadius: 8,
    border: "1px solid #E2E8F0",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
    fontSize: 12,
  },
};
