/**
 * AI 인사이트 페이지
 * 실제 AI 분석 기능 — OpenRouter API (백엔드 경유, 키 노출 없음)
 * 
 * 기능:
 * 1. AI에게 자연어로 경영 질문
 * 2. 대시보드 데이터 기반 자동 인사이트 생성
 * 3. 실시간 채팅 UI
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { Brain, AlertTriangle, Zap, Send, Loader2, Sparkles, RotateCcw, Bot, User } from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import InsightCard from "@/components/ui/InsightCard";
import { useDashboardData } from "@/hooks/useAPI";
import axios from "axios";

// ═══════════════════════════════════════
// AI 채팅 메시지 타입
// ═══════════════════════════════════════
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  tokensUsed?: number;
}

// 추천 질문 목록
const SUGGESTED_QUESTIONS = [
  "이번 달 매출이 전월 대비 어떤가요?",
  "신환 전환율이 낮은 원인은?",
  "인건비율을 줄이려면?",
  "가장 수익성 높은 진료항목은?",
  "체어 가동률을 높이려면?",
  "임플란트 매출을 늘리는 전략은?",
];

export default function InsightsPage() {
  const { insights: defaultInsights, totalRevenue, totalNewPt, totalVisits, avgChairRate, lostPtCount, doctorStats } = useDashboardData();
  
  // ─── AI 채팅 상태 ───
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [totalTokens, setTotalTokens] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // ─── AI 인사이트 상태 ───
  const [aiInsights, setAiInsights] = useState(defaultInsights);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  // 채팅 스크롤 자동 이동
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // AI 서비스 상태 체크
  useEffect(() => {
    const checkAI = async () => {
      try {
        const res = await axios.get("/api/ai/status");
        setAiAvailable(res.data.available);
      } catch {
        // 백엔드 미연결 시 데모 모드
        setAiAvailable(null);
      }
    };
    checkAI();
  }, []);

  // ─── 핸들러: AI에게 질문 ───
  const handleAskAI = async (question?: string) => {
    const q = question || inputValue.trim();
    if (!q || isAiLoading) return;

    // 사용자 메시지 추가
    const userMsg: ChatMessage = {
      role: "user",
      content: q,
      timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsAiLoading(true);

    // 현재 대시보드 데이터 컨텍스트 구성
    const contextData = {
      총수익_만원: totalRevenue,
      이번달_신환수: totalNewPt,
      총진료건수: totalVisits,
      체어가동률_퍼센트: avgChairRate,
      이탈위험환자수: lostPtCount,
      의사별_성과: doctorStats.map(d => ({
        이름: d.name,
        총수익_만원: d.totalRevenue,
        신환수: d.newPatients,
        체어점유율: d.chairOccupancy,
      })),
    };

    try {
      const res = await axios.post("/api/ai/ask", {
        question: q,
        context: contextData,
      });

      const aiMsg: ChatMessage = {
        role: "assistant",
        content: res.data.answer,
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        tokensUsed: res.data.tokens_used,
      };
      setMessages(prev => [...prev, aiMsg]);
      setTotalTokens(prev => prev + (res.data.tokens_used || 0));
    } catch (error: unknown) {
      // 백엔드 미연결 시 데모 응답
      const errMsg = axios.isAxiosError(error) ? error.message : "알 수 없는 오류";
      const fallbackMsg: ChatMessage = {
        role: "assistant",
        content: `⚠️ AI 서비스에 연결할 수 없습니다 (${errMsg}).\n\n백엔드 서버를 시작해주세요:\n\`\`\`\ncd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000\n\`\`\`\n\n현재는 데모 데이터로 대시보드가 운영됩니다. 백엔드 연결 후 실제 AI 분석이 가능합니다.`,
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsAiLoading(false);
      inputRef.current?.focus();
    }
  };

  // ─── 핸들러: AI 인사이트 재생성 ───
  const handleRegenerateInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      const res = await axios.post("/api/ai/insights", {
        data: {
          총수익_만원: totalRevenue,
          신환수: totalNewPt,
          총진료건수: totalVisits,
          체어가동률: avgChairRate,
          이탈위험환자수: lostPtCount,
        },
      });
      // AI가 생성한 인사이트에 시간 추가
      const newInsights = res.data.map((ins: { type: string; title: string; body: string; impact: string; priority: string }) => ({
        ...ins,
        time: "방금 전",
      }));
      setAiInsights(newInsights);
    } catch {
      // 실패 시 기본 인사이트 유지
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Enter 키 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAskAI();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard label="이번 주 인사이트" value={aiInsights.length + "건"} icon={Brain} color="purple" />
        <KPICard label="긴급 알림" value={aiInsights.filter(i => i.priority === "high").length + "건"} icon={AlertTriangle} color="red" />
        <KPICard
          label="AI 사용량"
          value={totalTokens > 0 ? `${(totalTokens / 1000).toFixed(1)}K` : "0"}
          sub="토큰 사용"
          icon={Zap}
          color="green"
        />
      </div>

      {/* ════════════════ AI 채팅 섹션 ════════════════ */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
        {/* 헤더 */}
        <div className="px-5 py-4" style={{ backgroundColor: "#EFF6FF" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#1A56DB" }}>
                <Brain size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: "#1A56DB" }}>덴비 AI 경영 인사이트</h3>
                <p className="text-xs" style={{ color: "#64748B" }}>
                  전자차트 데이터를 AI가 분석하여 실시간 경영 인사이트를 제공합니다
                  {aiAvailable === true && <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#22C55E" }} />}
                  {aiAvailable === false && <span className="ml-2" style={{ color: "#F59E0B" }}>· API 키 미설정</span>}
                </p>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                style={{ backgroundColor: "white", color: "#64748B", border: "1px solid #E2E8F0" }}
              >
                <RotateCcw size={12} />새 대화
              </button>
            )}
          </div>
        </div>

        {/* 채팅 영역 */}
        <div className="h-96 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
          {messages.length === 0 ? (
            // 빈 상태 — 추천 질문 표시
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(26,86,219,0.1)" }}>
                <Sparkles size={28} style={{ color: "#1A56DB" }} />
              </div>
              <h4 className="font-semibold text-gray-700 mb-1">치과 경영에 대해 물어보세요</h4>
              <p className="text-sm text-gray-400 mb-4">현재 대시보드 데이터를 기반으로 분석합니다</p>
              <div className="grid grid-cols-2 gap-2 max-w-md">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleAskAI(q)}
                    className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // 채팅 메시지 목록
            <>
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#1A56DB" }}>
                      <Bot size={16} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-[75%] ${
                    msg.role === "user"
                      ? "text-white rounded-2xl rounded-tr-md"
                      : "bg-white text-gray-800 rounded-2xl rounded-tl-md border border-gray-100 shadow-sm"
                  } px-4 py-3`}
                  style={msg.role === "user" ? { backgroundColor: "#1A56DB" } : undefined}
                >
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    <div className={`text-xs mt-1.5 flex items-center gap-2 ${
                      msg.role === "user" ? "text-blue-200" : "text-gray-400"
                    }`}>
                      {msg.timestamp}
                      {msg.tokensUsed && <span>· {msg.tokensUsed} tokens</span>}
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User size={16} className="text-white" />
                    </div>
                  )}
                </div>
              ))}
              {/* 로딩 인디케이터 */}
              {isAiLoading && (
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#1A56DB" }}>
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 size={14} className="animate-spin" />
                      AI가 분석 중입니다...
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* 입력 영역 */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="예: 이번 달 수익이 감소한 원인은?"
              disabled={isAiLoading}
              className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={() => handleAskAI()}
              disabled={!inputValue.trim() || isAiLoading}
              className="text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
              style={{ backgroundColor: "#1A56DB" }}
            >
              {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              분석
            </button>
          </div>
          {/* 빠른 질문 버튼 (채팅 시작 후) */}
          {messages.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {SUGGESTED_QUESTIONS.slice(0, 3).map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleAskAI(q)}
                  disabled={isAiLoading}
                  className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════ 자동 인사이트 섹션 ════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-violet-600" />
            <h3 className="font-semibold text-gray-900">AI 자동 인사이트</h3>
            <span className="text-xs text-gray-400">({aiInsights.length}건)</span>
          </div>
          <button
            onClick={handleRegenerateInsights}
            disabled={isGeneratingInsights}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50"
          >
            {isGeneratingInsights ? (
              <><Loader2 size={14} className="animate-spin" />생성 중...</>
            ) : (
              <><RotateCcw size={14} />AI로 재분석</>
            )}
          </button>
        </div>
        <div className="space-y-4">
          {aiInsights.map((ins, i) => (
            <InsightCard key={i} insight={ins} />
          ))}
        </div>
      </div>
    </div>
  );
}
