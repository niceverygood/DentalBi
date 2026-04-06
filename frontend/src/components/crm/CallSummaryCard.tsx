/**
 * AI 통화 요약 카드 컴포넌트
 */
import { Brain, ArrowRight, Smile, Meh, Frown, HelpCircle } from "lucide-react";
import type { CallSummary } from "@/types";

const SENTIMENT_ICON: Record<string, { Icon: typeof Smile; color: string }> = {
  "긍정":   { Icon: Smile,        color: "text-green-500" },
  "중립":   { Icon: Meh,          color: "text-gray-500" },
  "부정":   { Icon: Frown,        color: "text-red-500" },
  "불확실": { Icon: HelpCircle,   color: "text-yellow-500" },
};

export function CallSummaryCard({ summary }: { summary: CallSummary }) {
  const sentimentConfig = SENTIMENT_ICON[summary.sentiment] || SENTIMENT_ICON["불확실"];
  const SentimentIcon = sentimentConfig.Icon;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
      <div className="flex items-center gap-2 mb-3">
        <Brain size={16} className="text-blue-600" />
        <span className="text-sm font-semibold text-blue-900">AI 통화 요약</span>
        <div className="ml-auto flex items-center gap-1">
          <SentimentIcon size={14} className={sentimentConfig.color} />
          <span className={`text-xs ${sentimentConfig.color}`}>{summary.sentiment}</span>
        </div>
      </div>

      {/* 요약 */}
      <p className="text-sm text-gray-800 mb-3 leading-relaxed">{summary.summary}</p>

      {/* 사유 & 결과 */}
      <div className="flex gap-3 mb-3">
        <div className="flex-1 bg-white/60 rounded-lg px-3 py-2">
          <div className="text-[10px] text-gray-500 mb-0.5">통화 사유</div>
          <div className="text-xs font-medium text-gray-800">{summary.reason}</div>
        </div>
        <div className="flex-1 bg-white/60 rounded-lg px-3 py-2">
          <div className="text-[10px] text-gray-500 mb-0.5">통화 결과</div>
          <div className="text-xs font-medium text-gray-800">{summary.outcome}</div>
        </div>
      </div>

      {/* 다음 단계 */}
      {summary.next_steps && summary.next_steps.length > 0 && (
        <div>
          <div className="text-[10px] text-gray-500 mb-1">다음 조치</div>
          <div className="space-y-1">
            {summary.next_steps.map((step, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                <ArrowRight size={10} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
