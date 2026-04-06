/**
 * 통화 결과 배지 컴포넌트
 */

const RESULT_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  appointment: { label: "예약완료", bg: "bg-green-50", text: "text-green-700" },
  callback:    { label: "콜백예정", bg: "bg-blue-50",  text: "text-blue-700" },
  no_answer:   { label: "부재중",   bg: "bg-gray-100", text: "text-gray-600" },
  refused:     { label: "거부",     bg: "bg-red-50",   text: "text-red-700" },
  other:       { label: "기타",     bg: "bg-yellow-50", text: "text-yellow-700" },
};

export function CallResultBadge({ result }: { result?: string }) {
  if (!result) return <span className="text-xs text-gray-400">-</span>;

  const config = RESULT_CONFIG[result] || RESULT_CONFIG.other;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
