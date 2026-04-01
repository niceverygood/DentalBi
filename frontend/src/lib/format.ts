/**
 * 숫자 포맷팅 유틸리티
 * 프론트엔드 차트 데이터는 만원 단위로 표시 (AGENTS.md 규칙)
 */

/** 만원 단위 통화 표시 (예: 15,779만원) */
export function fmtWon(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + "억";
  return n.toLocaleString() + "만원";
}

/** 큰 숫자 축약 표시 (축 라벨용: 1.2억, 9.0천, 500) */
export function fmt(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + "억";
  if (n >= 1000) return (n / 1000).toFixed(1) + "천";
  return n.toLocaleString();
}

/** 퍼센트 표시 (예: 8.2%) */
export function fmtPct(n: number): string {
  return n.toFixed(1) + "%";
}

/** 천단위 콤마 (예: 1,234) */
export function fmtNum(n: number): string {
  return n.toLocaleString();
}

/** 원 단위를 만원 단위로 변환 */
export function toManwon(won: number): number {
  return Math.round(won / 10000);
}
