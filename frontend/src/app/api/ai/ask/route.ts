/**
 * AI 질문 API Route
 * OpenRouter API를 통해 Claude로 치과 경영 분석
 * Vercel Serverless Function으로 실행 — API 키 서버에서만 처리
 */
import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const MODELS = [
  "anthropic/claude-3-5-haiku",
  "anthropic/claude-3.5-sonnet",
];

const SYSTEM_PROMPT = "당신은 DentalBI의 AI 치과 경영 분석 전문가입니다.\n" +
  "서울대 치과경영정보학교실 최형길 교수의 치과 경영 분석 프레임워크를 기반으로 답변합니다.\n\n" +
  "## 전문 분야\n" +
  "- 치과 매출 분석 (총수익 = 면세수납 + 부가세수납 + 공단부담금)\n" +
  "- 의사별 성과 분석 (진료건수, 신환 전환율, 체어 가동률)\n" +
  "- 환자 관리 (Lost Patient, Turn-away Patient 분석)\n" +
  "- TxMix 분석 (임플란트/크라운/발치/근관치료 등 구성비)\n" +
  "- 신환 분석 (초진 후 9개월 내 누적 수납)\n" +
  "- 체어 가동률 최적화\n\n" +
  "## 답변 원칙\n" +
  "1. 구체적인 숫자와 데이터를 기반으로 분석\n" +
  "2. 실행 가능한 개선 방안 제시\n" +
  "3. 예상 효과를 금액으로 환산 (만원 단위)\n" +
  "4. 한국 치과 시장 현실에 맞는 조언\n" +
  "5. 답변은 한국어로, 핵심을 간결하게\n\n" +
  "## 주요 KPI 기준\n" +
  "- 체어 가동률 목표: 75% 이상\n" +
  "- 신환 전환율 목표: 초진 후 재내원 80% 이상\n" +
  "- 크라운 진행률: 근관치료 후 크라운 80% 이상\n" +
  "- 환자 이탈률: 월 3% 이하";

function formatContext(data: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push("- " + key + ": " + value.length + "건의 데이터");
    } else if (typeof value === "object" && value !== null) {
      lines.push("- " + key + ":");
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        lines.push("  · " + k + ": " + v);
      }
    } else {
      lines.push("- " + key + ": " + value);
    }
  }
  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { detail: "AI API 키가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { question, context } = body;

  if (!question?.trim()) {
    return NextResponse.json(
      { detail: "질문을 입력해주세요" },
      { status: 400 }
    );
  }

  let userMessage = question;
  if (context) {
    const dataSummary = formatContext(context);
    userMessage = "[현재 대시보드 데이터]\n" + dataSummary + "\n\n[질문]\n" + question;
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ];

  // 모델 순서대로 시도 (fallback)
  let lastError: Error | null = null;
  for (const model of MODELS) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + apiKey,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://denbi.vercel.app",
          "X-Title": "DenBI",
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 1500,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error("OpenRouter " + response.status + ": " + errText);
      }

      const result = await response.json();
      const answer = result.choices[0].message.content;
      const tokensUsed = result.usage?.total_tokens || 0;

      return NextResponse.json({
        answer,
        model,
        tokens_used: tokensUsed,
      });
    } catch (e) {
      lastError = e as Error;
      continue;
    }
  }

  return NextResponse.json(
    { detail: "AI 분석 실패: " + (lastError?.message || "알 수 없는 오류") },
    { status: 500 }
  );
}
