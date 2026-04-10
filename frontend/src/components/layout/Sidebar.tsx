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
    <aside className="w-56 flex flex-col flex-shrink-0 bg-white" style={{ borderRight: "1px solid #E2E8F0" }}>
      {/* 로고 영역 */}
      <div className="p-5" style={{ borderBottom: "1px solid #E2E8F0" }}>
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="덴비" width={28} height={28} className="rounded-md" />
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-lg" style={{ color: "#1A56DB" }}>덴비</span>
            <span className="text-xs" style={{ color: "#94A3B8" }}>DenBI</span>
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
                active ? "font-semibold" : ""
              }`}
              style={
                active
                  ? { backgroundColor: "#EFF6FF", color: "#1A56DB", borderLeft: "3px solid #1A56DB" }
                  : { color: "#64748B" }
              }
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = "#F8FAFC";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Icon
                size={16}
                className={active ? "text-[#1A56DB]" : "text-[#94A3B8]"}
              />
              {item.label}
              {badge !== undefined && (
                <span
                  className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={
                    item.id === "patients"
                      ? { backgroundColor: "rgba(239,68,68,0.1)", color: "#EF4444" }
                      : { backgroundColor: "#EFF6FF", color: "#1A56DB" }
                  }
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* 총괄관리자 콘솔 — 구분선으로 분리 */}
        <div className="pt-2 mt-2" style={{ borderTop: "1px solid #E2E8F0" }}>
          <Link
            href="/superadmin"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
              superadminActive ? "font-semibold" : ""
            }`}
            style={
              superadminActive
                ? { backgroundColor: "rgba(239,68,68,0.08)", color: "#EF4444" }
                : { color: "#EF4444" }
            }
          >
            <Shield size={16} style={{ color: "#EF4444" }} />
            총괄관리자
          </Link>
        </div>
      </nav>

      {/* 하단: 슬로건 + 동기화 상태 */}
      <div className="p-3" style={{ borderTop: "1px solid #E2E8F0" }}>
        {/* 동기화 상태 */}
        <div className="rounded-lg p-3" style={{ backgroundColor: "#F8FAFC" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full animate-pulse-dot" style={{ backgroundColor: "#22C55E" }} />
            <span className="text-xs font-medium" style={{ color: "#22C55E" }}>동기화 완료</span>
          </div>
          <p className="text-xs" style={{ color: "#64748B" }}>동기화: 오늘 02:00</p>
        </div>
        {/* 슬로건 */}
        <p className="text-[10px] text-center mt-2" style={{ color: "#94A3B8" }}>
          통화는 통비서, 경영은 덴비
        </p>
      </div>
    </aside>
  );
}
