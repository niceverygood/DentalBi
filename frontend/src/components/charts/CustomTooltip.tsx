/**
 * Recharts 공통 툴팁 컴포넌트
 * 모든 차트에서 일관된 툴팁 스타일 적용
 */

interface TooltipEntry {
  name?: string;
  value?: number;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  suffix?: string;
}

export default function CustomTooltip({ active, payload, label, suffix = "만원" }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-md p-3 text-xs">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-500">{entry.name}:</span>
          <span className="font-semibold text-gray-900">
            {Number(entry.value).toLocaleString()}{suffix}
          </span>
        </div>
      ))}
    </div>
  );
}
