/**
 * KPI 지표 카드 컴포넌트
 * 덴비(DenBI) 대시보드 KPI 카드
 */
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

/** 색상 테마 매핑 — 강조색 #1A56DB 통일 */
const COLOR_MAP: Record<string, string> = {
  blue:   "",
  green:  "",
  purple: "",
  amber:  "",
  red:    "",
  cyan:   "",
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
      className="bg-white rounded-xl p-5 transition-all cursor-default"
      style={{ border: "1px solid #E2E8F0" }}
      onClick={onClick}
    >
      {/* 상단: 라벨 + 아이콘 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#EFF6FF", color: "#1A56DB" }}>
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
