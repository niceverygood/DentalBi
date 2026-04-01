import type { NextConfig } from "next";

/**
 * DentalBI Next.js 설정
 * API 프록시: /api/* 요청을 FastAPI 백엔드로 전달
 */
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
