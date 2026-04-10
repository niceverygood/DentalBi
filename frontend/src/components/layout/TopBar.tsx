/**
 * 상단 헤더 바 컴포넌트
 * 페이지 제목, 기간 선택, 의사 선택, 알림 패널, 사용자 프로필/로그아웃
 */
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell, Settings, LogOut, User, ChevronDown,
  CheckCheck, AlertTriangle, TrendingUp, UserPlus,
  X, Clock, Calendar,
} from "lucide-react";
import { DOCTORS } from "@/lib/constants";
import { useAuthContext } from "@/contexts/AuthContext";

interface TopBarProps {
  pageTitle: string;
  clinicName?: string;
  period: string;
  onPeriodChange: (period: "today" | "week" | "month" | "quarter" | "year") => void;
  displayDate?: string;
}

const PERIOD_OPTIONS = [
  { key: "today",   label: "오늘" },
  { key: "week",    label: "이번주" },
  { key: "month",   label: "이번달" },
  { key: "quarter", label: "분기" },
];

// ═══════════════════════════════════════
// 데모 알림 데이터
// ═══════════════════════════════════════
interface Notification {
  id: number;
  type: "info" | "warning" | "success" | "patient";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 1, type: "warning",  title: "이탈 환자 발생", message: "최○○ 환자가 3회 연속 미내원 — 이탈 위험", time: "10분 전", read: false },
  { id: 2, type: "success",  title: "월 매출 목표 달성", message: "이번달 매출이 목표의 105%를 달성했습니다", time: "1시간 전", read: false },
  { id: 3, type: "patient",  title: "신환 접수", message: "오늘 신환 3명 접수 (보철 2, 교정 1)", time: "2시간 전", read: false },
  { id: 4, type: "info",     title: "AI 인사이트 생성됨", message: "이번주 체어 가동률 분석 보고서가 준비되었습니다", time: "3시간 전", read: false },
  { id: 5, type: "warning",  title: "데이터 동기화 지연", message: "전자차트 DB 동기화가 30분 이상 지연되고 있습니다", time: "어제", read: true },
  { id: 6, type: "info",     title: "시스템 업데이트", message: "덴비 v2.1 업데이트가 적용되었습니다", time: "2일 전", read: true },
];

const ROLE_LABELS: Record<string, string> = {
  superadmin: "총괄관리자",
  owner: "Owner",
  admin: "Admin",
  viewer: "Viewer",
};

const ROLE_COLORS: Record<string, string> = {
  superadmin: "bg-red-100 text-red-700",
  owner: "bg-amber-100 text-amber-700",
  admin: "bg-blue-100 text-blue-700",
  viewer: "bg-gray-100 text-gray-600",
};

export default function TopBar({
  pageTitle,
  clinicName,
  period,
  onPeriodChange,
  displayDate,
}: TopBarProps) {
  const { user, logout } = useAuthContext();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  /** 알림 읽음 처리 */
  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  /** 모두 읽음 */
  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  /** 알림 삭제 */
  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  /** 알림 아이콘 */
  const NotifIcon = ({ type }: { type: string }) => {
    switch (type) {
      case "warning": return <AlertTriangle size={14} className="text-amber-500" />;
      case "success": return <TrendingUp size={14} className="text-emerald-500" />;
      case "patient": return <UserPlus size={14} className="text-blue-500" />;
      default: return <Bell size={14} style={{ color: "#1A56DB" }} />;
    }
  };

  const displayClinic = user?.clinicName || clinicName || "아나플란트치과";

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
      {/* 좌측: 페이지 제목 + 치과명 */}
      <div>
        <h1 className="font-bold text-lg text-gray-900">{pageTitle}</h1>
        <p className="text-xs text-gray-400">
          {displayClinic} · {displayDate || "2026년 3월"}
        </p>
      </div>

      {/* 우측: 필터 + 알림 + 프로필 */}
      <div className="flex items-center gap-3">
        {/* 기간 선택 */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {PERIOD_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onPeriodChange(key as "today" | "week" | "month" | "quarter" | "year")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                period === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 의사 선택 */}
        <select className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">전체 의사</option>
          {DOCTORS.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        {/* 알림 벨 */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell size={18} className="text-gray-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount}
              </span>
            )}
          </button>

          {/* 알림 패널 */}
          {showNotifications && (
            <div className="absolute right-0 top-11 z-50 w-96 bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden animate-fade-in">
              {/* 헤더 */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm">알림</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <CheckCheck size={12} />모두 읽음
                  </button>
                )}
              </div>

              {/* 알림 목록 */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400 text-sm">
                    알림이 없습니다
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors flex gap-3 ${
                        !notif.read ? "bg-blue-50/40" : ""
                      }`}
                    >
                      {/* 아이콘 */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        notif.type === "warning" ? "bg-amber-100" :
                        notif.type === "success" ? "bg-emerald-100" :
                        notif.type === "patient" ? "bg-blue-100" : "bg-blue-50"
                      }`}>
                        <NotifIcon type={notif.type} />
                      </div>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm ${!notif.read ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                            {notif.title}
                          </p>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeNotification(notif.id); }}
                            className="text-gray-300 hover:text-gray-500 p-0.5"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Clock size={10} />{notif.time}
                        </p>
                      </div>

                      {/* 읽지 않은 표시 점 */}
                      {!notif.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* 푸터 */}
              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                <button className="text-xs text-gray-500 hover:text-gray-700 w-full text-center">
                  모든 알림 보기
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 사용자 프로필 & 로그아웃 */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: user?.role === "superadmin" ? "#EF4444" : "#1A56DB" }}>
              {user?.name?.[0] || "U"}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-gray-900">{user?.name || "사용자"}</div>
              <div className="text-[10px] text-gray-400">{user?.clinicName || ""}</div>
            </div>
            <ChevronDown size={14} className="text-gray-400 hidden md:block" />
          </button>

          {/* 프로필 드롭다운 */}
          {showProfile && (
            <div className="absolute right-0 top-12 z-50 w-64 bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden animate-fade-in">
              {/* 사용자 정보 */}
              <div className="px-4 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: user?.role === "superadmin" ? "#EF4444" : "#1A56DB" }}>
                    {user?.name?.[0] || "U"}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{user?.name}</div>
                    <div className="text-xs text-gray-400">{user?.email}</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[user?.role || "viewer"]}`}>
                    {ROLE_LABELS[user?.role || "viewer"]}
                  </span>
                  <span className="text-xs text-gray-400">{user?.clinicName}</span>
                </div>
              </div>

              {/* 메뉴 */}
              <div className="py-1">
                <button
                  onClick={() => { setShowProfile(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <User size={15} className="text-gray-400" />내 정보
                </button>
                <button
                  onClick={() => { setShowProfile(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <Settings size={15} className="text-gray-400" />설정
                </button>
              </div>

              {/* 로그아웃 */}
              <div className="border-t border-gray-100 py-1">
                <button
                  onClick={() => { setShowProfile(false); logout(); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                >
                  <LogOut size={15} className="text-red-400" />로그아웃
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
