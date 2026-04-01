/**
 * AI 인사이트 카드 컴포넌트
 * 우선순위별 컬러 보더 + 아이콘 + 상세보기
 */
import { AlertTriangle, TrendingUp, Clock, Target, Star, Eye } from "lucide-react";
import type { AIInsight } from "@/types";

/** 인사이트 타입별 아이콘 매핑 */
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  warning: AlertTriangle,
  danger: AlertTriangle,
  insight: TrendingUp,
  success: Star,
  info: Clock,
  action: Target,
};

interface InsightCardProps {
  insight: AIInsight;
  onClick?: () => void;
}

export default function InsightCard({ insight, onClick }: InsightCardProps) {
  const Icon = ICON_MAP[insight.type] || AlertTriangle;

  /** 우선순위별 스타일 */
  const borderColor =
    insight.priority === "high"
      ? "border-l-red-500"
      : insight.priority === "positive"
      ? "border-l-emerald-500"
      : "border-l-amber-500";

  const iconBg =
    insight.priority === "high"
      ? "bg-red-50 text-red-500"
      : insight.priority === "positive"
      ? "bg-emerald-50 text-emerald-500"
      : "bg-amber-50 text-amber-500";

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 border-l-4 ${borderColor} p-5 hover:shadow-md transition-shadow`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* 아이콘 */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${iconBg}`}>
          <Icon size={18} />
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-sm text-gray-900">{insight.title}</h4>
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{insight.time}</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-2">{insight.body}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {insight.impact}
            </span>
            <button className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <Eye size={12} />상세보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
