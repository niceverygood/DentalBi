"""
DentalBI AI 분석 서비스
OpenRouter API를 통해 Claude 모델로 치과 경영 분석 수행

보안: API 키는 backend/.env에만 저장, 프론트엔드 노출 절대 금지
"""
import json
import httpx
from typing import Optional
from app.config import settings


# ═══════════════════════════════════════
# OpenRouter API 설정
# ═══════════════════════════════════════
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# 모델 우선순위 — 첫 번째 실패 시 자동 fallback
MODELS = [
    "anthropic/claude-3.5-sonnet",     # 1순위: Sonnet (고품질)
    "anthropic/claude-3-5-haiku",      # 2순위: Haiku (빠르고 저렴)
]

# ═══════════════════════════════════════
# 치과 경영 분석 시스템 프롬프트
# ═══════════════════════════════════════
SYSTEM_PROMPT = """당신은 DentalBI의 AI 치과 경영 분석 전문가입니다.
서울대 치과경영정보학교실 최형길 교수의 치과 경영 분석 프레임워크를 기반으로 답변합니다.

## 전문 분야
- 치과 매출 분석 (총수익 = 면세수납 + 부가세수납 + 공단부담금)
- 의사별 성과 분석 (진료건수, 신환 전환율, 체어 가동률)
- 환자 관리 (Lost Patient, Turn-away Patient 분석)
- TxMix 분석 (임플란트/크라운/발치/근관치료 등 구성비)
- 신환 분석 (초진 후 9개월 내 누적 수납)
- 체어 가동률 최적화

## 답변 원칙
1. 구체적인 숫자와 데이터를 기반으로 분석
2. 실행 가능한 개선 방안 제시
3. 예상 효과를 금액으로 환산 (만원 단위)
4. 한국 치과 시장 현실에 맞는 조언
5. 답변은 한국어로, 핵심을 간결하게

## 주요 KPI 기준
- 체어 가동률 목표: 75% 이상
- 신환 전환율 목표: 초진 후 재내원 80% 이상
- 크라운 진행률: 근관치료 후 크라운 80% 이상
- 환자 이탈률: 월 3% 이하
"""


def _get_api_key() -> str:
    """API 키 가져오기 (openrouter_api_key 우선, claude_api_key 대체)"""
    key = settings.openrouter_api_key or settings.claude_api_key
    if not key:
        raise ValueError("AI API 키가 설정되지 않았습니다. backend/.env에 OPENROUTER_API_KEY를 설정하세요.")
    return key


async def _call_openrouter(messages: list, model: str, max_tokens: int = 1500) -> dict:
    """OpenRouter API 호출 (단일 모델)"""
    api_key = _get_api_key()

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://dentalbi.kr",
        "X-Title": "DentalBI",
    }

    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.3,
    }

    async with httpx.AsyncClient(timeout=90.0) as client:
        response = await client.post(OPENROUTER_URL, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()


async def analyze_with_ai(
    question: str,
    context_data: Optional[dict] = None,
) -> dict:
    """
    OpenRouter API를 통해 AI 분석 수행 (모델 자동 fallback)

    Args:
        question: 사용자 질문
        context_data: 대시보드에서 전달하는 현재 데이터 컨텍스트

    Returns:
        { "answer": str, "model": str, "tokens_used": int }
    """
    # 컨텍스트 데이터가 있으면 프롬프트에 포함
    user_message = question
    if context_data:
        data_summary = _format_context(context_data)
        user_message = f"""[현재 대시보드 데이터]
{data_summary}

[질문]
{question}"""

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]

    # 모델 순서대로 시도 (Sonnet → Haiku fallback)
    last_error = None
    for model in MODELS:
        try:
            result = await _call_openrouter(messages, model)
            answer = result["choices"][0]["message"]["content"]
            tokens_used = result.get("usage", {}).get("total_tokens", 0)
            return {
                "answer": answer,
                "model": model,
                "tokens_used": tokens_used,
            }
        except Exception as e:
            last_error = e
            continue  # 다음 모델로 fallback

    raise last_error or ValueError("모든 AI 모델 호출에 실패했습니다")


async def generate_insights(dashboard_data: dict) -> list[dict]:
    """
    대시보드 데이터 기반 자동 인사이트 생성

    Args:
        dashboard_data: 현재 대시보드의 KPI 데이터

    Returns:
        [ { "type": str, "title": str, "body": str, "impact": str, "priority": str } ]
    """
    data_summary = _format_context(dashboard_data)

    prompt = f"""아래 치과 경영 데이터를 분석하고, 가장 중요한 인사이트 3~5개를 JSON 배열로 반환해주세요.

[대시보드 데이터]
{data_summary}

각 인사이트는 다음 형식으로 반환:
[
  {{
    "type": "warning" | "insight" | "action",
    "title": "인사이트 제목 (20자 이내)",
    "body": "상세 분석 내용 (100자 이내)",
    "impact": "추정 영향 금액 또는 효과",
    "priority": "high" | "medium" | "positive"
  }}
]

JSON 배열만 반환하고 다른 텍스트는 포함하지 마세요."""

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt},
    ]

    # 모델 순서대로 시도
    last_error = None
    for model in MODELS:
        try:
            result = await _call_openrouter(messages, model, max_tokens=2000)
            raw_answer = result["choices"][0]["message"]["content"]

            # JSON 파싱 (```json ... ``` 감싸기 처리)
            cleaned = raw_answer.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
                cleaned = cleaned.rsplit("```", 1)[0]
            cleaned = cleaned.strip()

            try:
                insights = json.loads(cleaned)
                return insights
            except json.JSONDecodeError:
                return [{
                    "type": "insight",
                    "title": "AI 분석 완료",
                    "body": raw_answer[:200],
                    "impact": "상세 분석 필요",
                    "priority": "medium",
                }]
        except Exception as e:
            last_error = e
            continue

    raise last_error or ValueError("인사이트 생성 실패")


def _format_context(data: dict) -> str:
    """대시보드 데이터를 텍스트로 포맷팅"""
    lines = []
    for key, value in data.items():
        if isinstance(value, list):
            lines.append(f"- {key}: {len(value)}건의 데이터")
            if len(value) > 0 and isinstance(value[0], dict):
                for item in value[:3]:
                    lines.append(f"  · {item}")
        elif isinstance(value, dict):
            lines.append(f"- {key}:")
            for k, v in value.items():
                lines.append(f"  · {k}: {v}")
        else:
            lines.append(f"- {key}: {value}")
    return "\n".join(lines)
