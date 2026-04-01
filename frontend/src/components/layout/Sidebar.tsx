/**
 * 사이드바 네비게이션 컴포넌트 — 덴비(DenBI) 브랜딩
 * NAV_ITEMS를 순회하며 현재 페이지에 하이라이트 표시
 * DB 연결 상태 + 동기화 시각 표시
 */
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Shield } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";

interface SidebarProps {
  lostPtCount?: number;
  insightCount?: number;
}

export default function Sidebar({ lostPtCount = 0, insightCount = 5 }: SidebarProps) {
  const pathname = usePathname();

  /** 현재 활성 탭 판별 */
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const superadminActive = pathname.startsWith("/superadmin");

  return (
    <aside className="w-56 flex flex-col flex-shrink-0" style={{ backgroundColor: "#0F172A" }}>
      {/* 로고 영역 — 덴비 */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          {/* 덴비 로고: 파란색 사각형에 D + AI 도트 */}
          <div className="relative w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#1A56DB" }}>
            <span className="text-white font-bold text-lg leading-none">D</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{ backgroundColor: "#38BDF8" }} />
          </div>
          <div>
            <div className="font-bold text-sm text-white">덴비</div>
            <div className="text-[10px]" style={{ color: "#64748B" }}>DenBI</div>
          </div>
        </div>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const badge =
            item.id === "patients" && lostPtCount > 0
              ? lostPtCount
              : item.id === "insights"
              ? insightCount
              : undefined;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? "font-semibold text-white"
                  : "hover:text-white"
              }`}
              style={
                active
                  ? { backgroundColor: "#1A56DB" }
                  : { color: "#94A3B8" }
              }
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = "#1E293B";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Icon
                size={16}
                className={active ? "text-white" : "text-slate-500"}
              />
              {item.label}
              {badge !== undefined && (
                <span
                  className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={
                    item.id === "patients"
                      ? { backgroundColor: "rgba(239,68,68,0.2)", color: "#EF4444" }
                      : { backgroundColor: "rgba(56,189,248,0.2)", color: "#38BDF8" }
                  }
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* 총괄관리자 콘솔 — 구분선으로 분리 */}
        <div className="pt-2 mt-2 border-t border-white/10">
          <Link
            href="/superadmin"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
              superadminActive
                ? "font-semibold"
                : ""
            }`}
            style={
              superadminActive
                ? { backgroundColor: "rgba(239,68,68,0.15)", color: "#EF4444" }
                : { color: "#EF4444" }
            }
          >
            <Shield size={16} style={{ color: superadminActive ? "#EF4444" : "#EF4444" }} />
            총괄관리자
          </Link>
        </div>
      </nav>

      {/* 하단: 슬로건 + 동기화 상태 */}
      <div className="p-3 border-t border-white/10">
        {/* 동기화 상태 */}
        <div className="rounded-lg p-3" style={{ backgroundColor: "rgba(34,197,94,0.1)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full animate-pulse-dot" style={{ backgroundColor: "#22C55E" }} />
            <span className="text-xs font-medium" style={{ color: "#22C55E" }}>동기화 완료</span>
          </div>
          <p className="text-xs" style={{ color: "#22C55E" }}>동기화: 오늘 02:00</p>
        </div>
        {/* 슬로건 */}
        <p className="text-[10px] text-center mt-2" style={{ color: "#64748B" }}>
          통화는 통비서, 경영은 덴비
        </p>
      </div>
    </aside>
  );
}
