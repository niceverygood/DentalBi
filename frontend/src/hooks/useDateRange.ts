/**
 * 날짜 범위 관리 훅
 * period 상태 관리 + start/end 날짜 자동 계산
 */
"use client";

import { useState, useMemo, useCallback } from "react";
import type { DateRange } from "@/types";

type Period = "today" | "week" | "month" | "quarter" | "year";

export function useDateRange(initialPeriod: Period = "month") {
  const [period, setPeriod] = useState<Period>(initialPeriod);

  /** 기간에 따른 시작/종료 날짜 계산 (KST 기준) */
  const dateRange: DateRange = useMemo(() => {
    const now = new Date();
    // KST 기준으로 날짜 계산 (UTC+9)
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const today = new Date(kst.getFullYear(), kst.getMonth(), kst.getDate());

    const format = (d: Date) =>
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

    let start: Date;
    switch (period) {
      case "today":
        start = today;
        break;
      case "week": {
        const dayOfWeek = today.getDay();
        start = new Date(today);
        start.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        break;
      }
      case "month":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "quarter": {
        const qMonth = Math.floor(today.getMonth() / 3) * 3;
        start = new Date(today.getFullYear(), qMonth, 1);
        break;
      }
      case "year":
        start = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    return {
      start: format(start),
      end: format(today),
      period,
    };
  }, [period]);

  /** 기간 변경 핸들러 */
  const changePeriod = useCallback((newPeriod: Period) => {
    setPeriod(newPeriod);
  }, []);

  /** 표시용 날짜 문자열 (예: "2026년 3월") */
  const displayDate = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}년 ${now.getMonth() + 1}월`;
  }, []);

  return { period, dateRange, changePeriod, displayDate };
}
