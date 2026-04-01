/**
 * 덴비(DenBI) 상수 정의
 * 차트 색상, 네비게이션 항목, 의사 기본 데이터
 */
import {
  Activity, BarChart3, DollarSign, Target, UserMinus,
  UserPlus, Clock, Brain, Settings, ShieldCheck, Crown,
} from "lucide-react";
import type { Doctor, NavItem } from "@/types";

/** 차트 기본 색상 팔레트 — 덴비 브랜드 */
export const CHART_COLORS = [
  "#1A56DB", "#8B5CF6", "#22C55E", "#F59E0B", "#EF4444",
  "#0891B2", "#4F46E5", "#EC4899", "#14B8A6", "#F97316",
];

/** 파이 차트 색상 */
export const PIE_COLORS = [
  "#1A56DB", "#22C55E", "#8B5CF6", "#F59E0B", "#0891B2",
  "#EF4444", "#4F46E5", "#EC4899",
];

/** 사이드바 네비게이션 항목 */
export const NAV_ITEMS: NavItem[] = [
  { id: "overview",      label: "종합 현황",        href: "/",              icon: Activity },
  { id: "doctors",       label: "의사별 성과",      href: "/doctors",       icon: BarChart3 },
  { id: "revenue",       label: "수납 관리",        href: "/revenue",       icon: DollarSign },
  { id: "txmix",         label: "진료내역(TxMix)",  href: "/txmix",         icon: Target },
  { id: "patients",      label: "환자 이탈 관리",   href: "/patients",      icon: UserMinus },
  { id: "newpatients",   label: "신환 분석",        href: "/newpatients",   icon: UserPlus },
  { id: "chair",         label: "체어 가동률",      href: "/chair",         icon: Clock },
  { id: "insights",      label: "AI 인사이트",      href: "/insights",      icon: Brain },
  { id: "settings",      label: "설정",             href: "/settings",      icon: Settings },
  { id: "admin",         label: "관리자",           href: "/admin",         icon: ShieldCheck },
  // 테스트 단계: 구독 관리 메뉴 숨김 (모든 기능 제한 없이 이용 가능)
  // { id: "subscription",  label: "구독 관리",        href: "/subscription",  icon: Crown },
];

/** 의사 기본 데이터 (데모용) — 덴비 브랜드 컬러 */
export const DOCTORS: Doctor[] = [
  { id: 1, name: "김원장", role: "대표원장", color: "#1A56DB" },
  { id: 2, name: "이원장", role: "부원장",   color: "#8B5CF6" },
  { id: 3, name: "박원장", role: "진료원장", color: "#22C55E" },
  { id: 4, name: "최원장", role: "진료원장", color: "#F59E0B" },
  { id: 5, name: "정원장", role: "봉직의",   color: "#EF4444" },
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
