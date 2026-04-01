"""
DentalBI AI 분석 라우터
프론트엔드 → 이 라우터 → OpenRouter API (API 키 서버에서만 처리)

보안: API 키는 절대 클라이언트에 전송하지 않음
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.ai_service import analyze_with_ai, generate_insights


router = APIRouter(prefix="/api/ai", tags=["AI 분석"])


# ═══════════════════════════════════════
# 요청/응답 스키마
# ═══════════════════════════════════════
class AskRequest(BaseModel):
    """AI 질문 요청"""
    question: str
    context: Optional[dict] = None  # 현재 대시보드 데이터


class AskResponse(BaseModel):
    """AI 답변 응답"""
    answer: str
    model: str
    tokens_used: int


class InsightRequest(BaseModel):
    """인사이트 생성 요청"""
    data: dict  # 대시보드 KPI 데이터


class InsightItem(BaseModel):
    """개별 인사이트"""
    type: str       # warning | insight | action
    title: str
    body: str
    impact: str
    priority: str   # high | medium | positive


# ═══════════════════════════════════════
# 엔드포인트
# ═══════════════════════════════════════
@router.post("/ask", response_model=AskResponse)
async def ask_ai(req: AskRequest):
    """
    AI에게 치과 경영 관련 질문
    프론트엔드에서 질문 + 현재 대시보드 데이터를 전송
    서버에서 OpenRouter API 호출 (API 키 서버에서만 관리)
    """
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="질문을 입력해주세요")

    if len(req.question) > 1000:
        raise HTTPException(status_code=400, detail="질문은 1000자 이내로 입력해주세요")

    try:
        result = await analyze_with_ai(
            question=req.question,
            context_data=req.context,
        )
        return AskResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 분석 중 오류 발생: {str(e)}")


@router.post("/insights", response_model=list[InsightItem])
async def generate_ai_insights(req: InsightRequest):
    """
    대시보드 데이터 기반 AI 인사이트 자동 생성
    """
    try:
        insights = await generate_insights(req.data)
        return [InsightItem(**ins) for ins in insights]
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"인사이트 생성 중 오류 발생: {str(e)}")


@router.get("/status")
async def ai_status():
    """AI 서비스 상태 확인 (API 키 설정 여부)"""
    from app.config import settings
    has_key = bool(settings.openrouter_api_key or settings.claude_api_key)
    return {
        "available": has_key,
        "model": "anthropic/claude-3.5-sonnet",
        # API 키 값은 절대 반환하지 않음 — 존재 여부만 반환
    }
