/**
 * AI 진료 설명 API Route
 * 전문 진료 용어를 환자가 이해하기 쉬운 말로 변환
 */
import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = "당신은 치과 진료 내용을 환자에게 쉽게 설명해주는 AI 도우미입니다.\n\n" +
  "## 원칙\n" +
  "1. 전문 용어를 일상 언어로 바꿔주세요\n" +
  "2. 왜 이 치료를 했는지 이유를 설명하세요\n" +
  "3. 환자가 주의할 점을 알려주세요\n" +
  "4. 다음에 어떤 치료가 예상되는지 안내하세요\n" +
  "5. 친절하고 안심이 되는 톤으로 말하세요\n" +
  "6. 200자 이내로 간결하게 설명하세요";

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ detail: "API 키 미설정" }, { status: 500 });
  }

  const { treatment, toothNumber, description } = await request.json();

  const userMessage = "진료명: " + treatment +
    (toothNumber ? "\n치아번호: " + toothNumber : "") +
    "\n진료기록: " + description +
    "\n\n위 진료를 환자에게 쉽게 설명해주세요. JSON으로 반환: {\"explanation\": \"...\", \"nextSteps\": [\"...\", \"...\"]}";

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://denbi.vercel.app",
        "X-Title": "DenBI Patient",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-5-haiku",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) throw new Error("OpenRouter error: " + response.status);

    const result = await response.json();
    const answer = result.choices[0].message.content;

    return NextResponse.json({ explanation: answer });
  } catch (e) {
    return NextResponse.json(
      { detail: "AI 분석 실패: " + (e as Error).message },
      { status: 500 }
    );
  }
}
