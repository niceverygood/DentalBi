import type { NextConfig } from "next";

/**
 * DentalBI Next.js 설정
 * - /api/ai/* → Next.js API Route (Vercel에서도 동작)
 * - /api/auth/*, /api/crm/* 등 → FastAPI 백엔드 (로컬 개발용)
 */
const nextConfig: NextConfig = {
  async rewrites() {
    // Vercel 배포 시 백엔드가 없으므로 rewrite 비활성
    if (process.env.VERCEL) {
      return [];
    }
    // 로컬 개발: AI 이외의 API를 FastAPI로 프록시
    return [
      {
        source: "/api/auth/:path*",
        destination: "http://localhost:8000/api/auth/:path*",
      },
      {
        source: "/api/crm/:path*",
        destination: "http://localhost:8000/api/crm/:path*",
      },
      {
        source: "/api/admin/:path*",
        destination: "http://localhost:8000/api/admin/:path*",
      },
      {
        source: "/api/superadmin/:path*",
        destination: "http://localhost:8000/api/superadmin/:path*",
      },
    ];
  },
};

export default nextConfig;
