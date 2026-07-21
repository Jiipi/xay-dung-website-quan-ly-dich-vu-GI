"use client";

import { motion, useSpring, useTransform } from "framer-motion"

import { useReducedMotion, useScrollProgress } from "@/lib/motion"

export interface ReadingProgressProps {
  /**
   * Reference tới element "đích" để đo % scroll (mặc định document).
   * Hiện tại component tự đo scrollY của window — có thể mở rộng
   * ref sau nếu cần track 1 vùng nhỏ.
   */
  targetRef?: unknown
}

/**
 * Mini progress bar mảnh (3px) cố định ở top viewport, đổi `scaleX`
 * theo tiến độ cuộn của trang. Hữu ích cho bài viết blog dài.
 *
 * Tôn trọng `prefers-reduced-motion`: ẩn bar (vẫn giữ layout).
 */
// targetRef được giữ chỗ cho việc mở rộng track progress trong 1 vùng
// nhỏ (vd: chỉ <article> body). Hiện tại chưa sử dụng — bỏ qua qua
// destructuring rỗng để tránh unused-vars.
export function ReadingProgress({ targetRef: _targetRef }: ReadingProgressProps) {
  void _targetRef
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScrollProgress()
  const smooth = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 30,
    mass: 0.4,
  })
  const scaleX = useTransform(smooth, [0, 1], [0, 1])

  if (prefersReducedMotion) return null

  return (
    <motion.div
      aria-hidden="true"
      className="reading-progress"
      style={{ scaleX }}
    />
  )
}
