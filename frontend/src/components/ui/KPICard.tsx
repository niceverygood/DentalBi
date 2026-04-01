/**
 * KPI 지표 카드 컴포넌트
 * 덴비(DenBI) 대시보드 KPI 카드
 */
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

/** 색상 테마 매핑 */
const COLOR_MAP: Record<string, string> = {
  blue:   "bg-blue-50 text-blue-600",
  green:  "bg-emerald-50 text-emerald-600",
  purple: "bg-violet-50 text-violet-600",
  amber:  "bg-amber-50 text-amber-600",
  red:    "bg-red-50 text-red-600",
  cyan:   "bg-cyan-50 text-cyan-600",
};

interface KPICardProps {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  sub?: string;
  trend?: number;
  color?: string;
  onClick?: () => void;
}

export default function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  color = "blue",
  onClick,
}: KPICardProps) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-default"
      onClick={onClick}
    >
      {/* 상단: 라벨 + 아이콘 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${COLOR_MAP[color] || COLOR_MAP.blue}`}>
            <Icon size={16} />
          </div>
        )}
      </div>

      {/* 중앙: 값 */}
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>

      {/* 하단: 트렌드 + 부가 정보 */}
      <div className="flex items-center gap-1">
        {trend !== undefined && (
          <span
            className={`text-xs font-medium flex items-center gap-0.5 ${
              trend >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
      </div>
    </div>
  );
}
