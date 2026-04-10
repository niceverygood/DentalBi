/**
 * 덴비(DenBI) 루트 레이아웃
 * AuthProvider로 전역 인증 상태 관리
 * 미인증 시 /login으로 자동 리다이렉트
 */
"use client";

import "./globals.css";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import PageContainer from "@/components/layout/PageContainer";
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import { useDateRange } from "@/hooks/useDateRange";
import { NAV_ITEMS } from "@/lib/constants";

/** 인증된 레이아웃 — Sidebar + TopBar + 콘텐츠 */
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { period, changePeriod, displayDate } = useDateRange("month");
  const { isLoading, isAuthenticated } = useAuthContext();

  // 현재 페이지 타이틀
  const currentNav = NAV_ITEMS.find((item) => {
    if (item.href === "/") return pathname === "/";
    return pathname.startsWith(item.href);
  });
  const pageTitle = pathname.startsWith("/superadmin")
    ? "총괄관리자"
    : pathname.startsWith("/subscription")
    ? "구독 관리"
    : currentNav?.label || "덴비";

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: "#1A56DB", borderTopColor: "transparent" }} />
          <p className="text-sm text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 미인증 시 빈 화면 (AuthContext에서 /login으로 리다이렉트 처리)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          pageTitle={pageTitle}
          period={period}
          onPeriodChange={changePeriod}
          displayDate={displayDate}
        />
        <PageContainer>{children}</PageContainer>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const isPublicPage = pathname.startsWith("/download") || pathname.startsWith("/patient");

  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <title>{isLoginPage ? "덴비 DenBI - 로그인" : "덴비 DenBI - AI 치과 경영 대시보드"}</title>
        <meta
          name="description"
          content="덴비(DenBI) — AI가 경영을 봅니다. 치과 전자차트 데이터를 AI로 분석하는 B2B SaaS 경영 대시보드"
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="h-full">
        <AuthProvider>
          {(isLoginPage || isPublicPage) ? children : <AuthenticatedLayout>{children}</AuthenticatedLayout>}
        </AuthProvider>
      </body>
    </html>
  );
}
