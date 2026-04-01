/**
 * 뱃지 컴포넌트들
 * Badge: 범용 뱃지, RiskBadge: 위험도 스코어 뱃지
 */

interface BadgeProps {
  text: string;
  color?: "blue" | "green" | "red" | "amber" | "gray" | "purple";
}

const BADGE_COLORS: Record<string, string> = {
  blue:   "bg-blue-100 text-blue-700",
  green:  "bg-green-100 text-green-700",
  red:    "bg-red-100 text-red-700",
  amber:  "bg-amber-100 text-amber-700",
  gray:   "bg-gray-100 text-gray-700",
  purple: "bg-purple-100 text-purple-700",
};

export function Badge({ text, color = "gray" }: BadgeProps) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${BADGE_COLORS[color]}`}>
      {text}
    </span>
  );
}

/** 위험도 점수 뱃지 (0~100) */
export function RiskBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-red-100 text-red-700"
      : score >= 60
      ? "bg-amber-100 text-amber-700"
      : "bg-green-100 text-green-700";

  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
      {score}점
    </span>
  );
}
