/**
 * 환자 포털 레이아웃
 * 모바일 최적화 + 하단 탭 네비게이션
 */
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Calendar, FileText } from "lucide-react";

const TABS = [
  { href: "/patient", icon: Home, label: "홈" },
  { href: "/patient/appointments", icon: Calendar, label: "예약" },
  { href: "/patient/records", icon: FileText, label: "진료기록" },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/patient/login";

  if (isLoginPage) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F8FAFC" }}>
      {/* 상단 헤더 */}
      <header className="bg-white px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #E2E8F0" }}>
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="덴비" width={24} height={24} className="rounded" />
          <span className="font-bold text-sm" style={{ color: "#1A56DB" }}>덴비</span>
          <span className="text-[10px]" style={{ color: "#94A3B8" }}>환자 포털</span>
        </div>
        <Link href="/patient/login" className="text-xs" style={{ color: "#94A3B8" }}>로그아웃</Link>
      </header>

      {/* 콘텐츠 */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 pb-24">
        {children}
      </main>

      {/* 하단 탭 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white" style={{ borderTop: "1px solid #E2E8F0" }}>
        <div className="max-w-lg mx-auto flex">
          {TABS.map(tab => {
            const active = tab.href === "/patient"
              ? pathname === "/patient"
              : pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors"
                style={{ color: active ? "#1A56DB" : "#94A3B8" }}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
