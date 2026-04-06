"""
DentalBI 통화 요약 서비스
1. Whisper API로 녹음 파일 STT
2. Claude API로 통화 내용 요약
"""
import json
import httpx
from typing import Optional
from app.config import settings


# ═══════════════════════════════════════
# STT: OpenAI Whisper API
# ═══════════════════════════════════════

async def transcribe_audio(audio_data: bytes, filename: str = "recording.m4a") -> str:
    """
    녹음 파일을 Whisper API로 전사

    Args:
        audio_data: 오디오 파일 바이트
        filename: 파일명 (확장자로 포맷 판별)

    Returns:
        전사된 텍스트
    """
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY가 설정되지 않았습니다.")

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {settings.openai_api_key}"},
            files={"file": (filename, audio_data)},
            data={
                "model": "whisper-1",
                "language": "ko",
                "response_format": "text",
            },
        )
        response.raise_for_status()
        return response.text.strip()


# ═══════════════════════════════════════
# AI 요약: Claude (OpenRouter)
# ═══════════════════════════════════════

CALL_SUMMARY_PROMPT = """당신은 치과 CRM 통화 분석 전문가입니다.
직원이 환자에게 전화한 통화 녹취 전사 내용을 분석하여 구조화된 요약을 생성합니다.

## 출력 형식 (JSON)
{{
  "summary": "통화 내용 2-3줄 요약",
  "reason": "통화 사유 (리콜/예약확인/치료안내/불만처리/기타)",
  "outcome": "통화 결과 (예약완료/콜백예정/부재중/거부/보류)",
  "next_steps": ["다음 조치사항 1", "다음 조치사항 2"],
  "sentiment": "환자 감정 (긍정/중립/부정/불확실)",
  "recommended_result": "appointment | callback | no_answer | refused | other"
}}

JSON만 반환하고 다른 텍스트는 포함하지 마세요."""


async def summarize_call(
    transcript: str,
    patient_context: Optional[dict] = None,
) -> dict:
    """
    통화 전사 내용을 Claude AI로 요약

    Args:
        transcript: STT 전사 결과
        patient_context: 환자 정보 (이름, 미완료 진료, 위험도 등)

    Returns:
        구조화된 요약 dict
    """
    api_key = settings.openrouter_api_key or settings.claude_api_key
    if not api_key:
        raise ValueError("AI API 키가 설정되지 않았습니다.")

    # 사용자 메시지 구성
    user_message = f"[통화 녹취 전사]\n{transcript}"
    if patient_context:
        ctx_lines = []
        if patient_context.get("name"):
            ctx_lines.append(f"환자명: {patient_context['name']}")
        if patient_context.get("pending_tx"):
            ctx_lines.append(f"미완료 진료: {patient_context['pending_tx']}")
        if patient_context.get("risk_score") is not None:
            ctx_lines.append(f"이탈 위험도: {patient_context['risk_score']}점")
        if patient_context.get("days_away") is not None:
            ctx_lines.append(f"미내원일수: {patient_context['days_away']}일")
        if ctx_lines:
            user_message = f"[환자 정보]\n" + "\n".join(ctx_lines) + "\n\n" + user_message

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://dentalbi.kr",
        "X-Title": "DentalBI CRM",
    }

    models = [
        "anthropic/claude-3.5-sonnet",
        "anthropic/claude-3-5-haiku",
    ]

    last_error = None
    for model in models:
        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": CALL_SUMMARY_PROMPT},
                            {"role": "user", "content": user_message},
                        ],
                        "max_tokens": 1000,
                        "temperature": 0.2,
                    },
                    headers=headers,
                )
                response.raise_for_status()
                raw = response.json()["choices"][0]["message"]["content"]

            # JSON 파싱
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
                cleaned = cleaned.rsplit("```", 1)[0]
            cleaned = cleaned.strip()

            return json.loads(cleaned)

        except Exception as e:
            last_error = e
            continue

    raise last_error or ValueError("통화 요약 생성 실패")
