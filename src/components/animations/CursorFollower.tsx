"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

import { useReducedMotion } from "@/lib/motion"

export interface CursorFollowerProps {
  /**
   * Bật tắt hiệu ứng. Mặc định bật. Component tự ẩn trên touch
   * device hoặc khi `prefers-reduced-motion`.
   */
  enabled?: boolean
}

/**
 * Theo dõi con trỏ chuột với 2 phần tử: dot 8px (tức thì) và ring
 * 36px (dùng spring để bám theo chậm hơn). Hỗ trợ mix-blend-difference
 * để dot luôn tương phản với nền.
 *
 * Không hiển thị trên thiết bị cảm ứng.
 */
export function CursorFollower({ enabled = true }: CursorFollowerProps) {
  const prefersReducedMotion = useReducedMotion()
  const [isTouch, setIsTouch] = useState(false)

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 180, damping: 22, mass: 0.6 })
  const ringY = useSpring(y, { stiffness: 180, damping: 22, mass: 0.6 })

  useEffect(() => {
    if (typeof window === "undefined") return
    const mediaQuery = window.matchMedia("(pointer: coarse)")

    const applyMatch = (matches: boolean) => {
      // Defer state update outside synchronous path to avoid cascading render.
      queueMicrotask(() => setIsTouch(matches))
    }
    applyMatch(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => applyMatch(event.matches)
    mediaQuery.addEventListener("change", handleChange)

    const handler = (event: MouseEvent) => {
      x.set(event.clientX)
      y.set(event.clientY)
    }
    window.addEventListener("mousemove", handler)
    return () => {
      mediaQuery.removeEventListener("change", handleChange)
      window.removeEventListener("mousemove", handler)
    }
  }, [x, y])

  if (!enabled || prefersReducedMotion || isTouch) {
    return null
  }

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[80] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground mix-blend-difference"
        style={{ x, y }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[79] h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground/40 mix-blend-difference"
        style={{ x: ringX, y: ringY }}
      />
    </>
  )
}
