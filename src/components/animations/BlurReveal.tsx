"use client"

import type { ElementType, ReactNode } from "react"
import { motion, type HTMLMotionProps } from "framer-motion"

import { useReducedMotion } from "@/lib/motion"
import { cn } from "@/lib/utils"

export interface BlurRevealProps {
  children: ReactNode
  delay?: number
  className?: string
  /**
   * Phần tử HTML để render (mặc định `div`). Truyền vào để semantic đúng:
   * `h1` cho tiêu đề chính, `p` cho đoạn văn…
   */
  as?: ElementType
}

/**
 * Hiệu ứng fade + blur + slide khi cuộn vào viewport. Tôn trọng
 * `prefers-reduced-motion` (chỉ fade, không blur/slide).
 */
export function BlurReveal({
  children,
  delay = 0,
  className,
  as,
}: BlurRevealProps) {
  const prefersReducedMotion = useReducedMotion()
  const MotionTag = motion.create(as ?? "div") as React.ComponentType<HTMLMotionProps<"div">>

  return (
    <MotionTag
      className={cn(className)}
      initial={
        prefersReducedMotion
          ? { opacity: 0 }
          : { opacity: 0, filter: "blur(12px)", y: 20 }
      }
      transition={{
        delay,
        duration: prefersReducedMotion ? 0.15 : 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
      viewport={{ once: true, margin: "-10% 0px" }}
      whileInView={
        prefersReducedMotion
          ? { opacity: 1 }
          : { opacity: 1, filter: "blur(0px)", y: 0 }
      }
    >
      {children}
    </MotionTag>
  )
}
