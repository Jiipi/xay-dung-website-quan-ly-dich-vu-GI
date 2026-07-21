"use client"

import { motion, useSpring, useTransform } from "framer-motion"

import { useReducedMotion, useScrollProgress } from "@/lib/motion"
import { cn } from "@/lib/utils"

export interface ScrollProgressBarProps {
  position?: "top" | "bottom"
  className?: string
  /**
   * Màu gradient cho thanh progress. Mặc định dùng gradient thương hiệu
   * (xanh dương → amber).
   */
  gradient?: string
}

/**
 * Thanh ngang 2-3px trên/dưới viewport cho biết % scroll của document.
 * Dùng `useScrollProgress` đã có sẵn.
 *
 * Tôn trọng `prefers-reduced-motion`: chuyển sang giá trị tĩnh 0 khi
 * cuộn xong để không có cảm giác "chạy".
 */
export function ScrollProgressBar({
  position = "top",
  className,
  gradient = "linear-gradient(90deg, #3b82f6 0%, #f59e0b 100%)",
}: ScrollProgressBarProps) {
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScrollProgress()
  const smooth = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.4,
  })
  const scaleX = useTransform(smooth, [0, 1], [0, 1])

  if (prefersReducedMotion) {
    return null
  }

  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed left-0 right-0 z-[60] h-[3px] origin-left",
        position === "top" ? "top-0" : "bottom-0",
        className,
      )}
      style={{
        scaleX,
        backgroundImage: gradient,
        boxShadow: "0 0 12px rgba(245, 158, 11, 0.35)",
      }}
    />
  )
}
