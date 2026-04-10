/**
 * AI 서비스 상태 확인 API Route
 * Vercel에서도 동작하도록 Next.js API Route로 구현
 */
import { NextResponse } from "next/server";

export async function GET() {
  const hasKey = !!process.env.OPENROUTER_API_KEY;
  return NextResponse.json({
    available: hasKey,
    model: "anthropic/claude-3.5-sonnet",
  });
}
