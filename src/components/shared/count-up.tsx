"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface CountUpProps {
  /** Giá trị đích cần đếm tới */
  end: number;
  /** Số chữ số thập phân (mặc định 0) */
  decimals?: number;
  /** Thời lượng animation (ms) */
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  /**
   * Tuỳ biến format. Nếu truyền vào, prop này sẽ được gọi với giá trị hiện tại
   * (0 → end) để hiển thị (ví dụ `Intl.NumberFormat`, suffix đặc biệt...).
   * Mặc định: `toLocaleString("vi-VN", { min/maxFractionDigits: decimals })`.
   */
  formatValue?: (value: number) => string | number;
}

/**
 * Đếm số động từ 0 → end khi phần tử cuộn vào tầm nhìn (chạy 1 lần).
 * Tôn trọng prefers-reduced-motion: hiển thị ngay giá trị cuối nếu người dùng tắt hiệu ứng.
 */
export function CountUp({
  end,
  decimals = 0,
  duration = 1800,
  prefix = "",
  suffix = "",
  className,
  formatValue,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    // Tôn trọng người dùng tắt animation
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // Người dùng tắt hiệu ứng -> đặt luôn giá trị cuối (set 1 lần, hợp lệ).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(end);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutCubic cho cảm giác mượt, chậm dần ở cuối
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(end * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isInView, end, duration]);

  const formatted =
    formatValue?.(value) ??
    value.toLocaleString("vi-VN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
