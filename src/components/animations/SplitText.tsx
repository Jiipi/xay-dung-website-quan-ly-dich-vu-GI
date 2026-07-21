"use client";

import { useMemo, type ElementType } from "react"
import { motion, type Variants } from "framer-motion"

import { useReducedMotion } from "@/lib/motion"
import { cn } from "@/lib/utils"

export interface SplitTextProps {
  children: string
  as?: ElementType
  className?: string
  delay?: number
  /**
   * Khoảng cách thời gian giữa các từ (giây). Mặc định 0.06.
   */
  wordStagger?: number
  /**
   * Khoảng cách thời gian giữa các ký tự trong một từ (giây).
   * Mặc định 0.025. Đặt thành 0 để chỉ tách theo từ.
   */
  charStagger?: number
}

const containerVariants: Variants = {
  hidden: {},
  visible: (custom: { wordStagger: number; delay: number }) => ({
    transition: {
      staggerChildren: custom.wordStagger,
      delayChildren: custom.delay,
    },
  }),
}

const charVariants: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

/**
 * Hiển thị chuỗi văn bản với từng từ (hoặc từng ký tự) chạy stagger
 * khi vào viewport. Hữu ích cho heading hero tạo cảm giác "năng động"
 * nhưng vẫn dễ đọc.
 *
 * Tôn trọng `prefers-reduced-motion`: render thẳng văn bản, không blur.
 */
export function SplitText({
  children,
  as,
  className,
  delay = 0,
  wordStagger = 0.06,
  charStagger = 0.025,
}: SplitTextProps) {
  void charStagger
  const prefersReducedMotion = useReducedMotion()
  const MotionTag = (as ? motion.create(as as ElementType) : motion.span) as typeof motion.span

  const words = useMemo(() => children.split(/(\s+)/), [children])

  if (prefersReducedMotion) {
    return <span className={cn(className)}>{children}</span>
  }

  return (
    <MotionTag
      className={cn("inline-block", className)}
      initial="hidden"
      viewport={{ once: true, margin: "-10% 0px" }}
      whileInView="visible"
      variants={containerVariants}
      custom={{ wordStagger, delay }}
    >
      {words.map((segment, wordIndex) => {
        if (/^\s+$/.test(segment)) {
          return (
            <span key={`space-${wordIndex}`} aria-hidden="true">
              {segment}
            </span>
          )
        }
        const chars = Array.from(segment)
        return (
          <span
            key={`word-${wordIndex}`}
            className="inline-block whitespace-nowrap"
            aria-label={segment}
          >
            {chars.map((char, charIndex) => (
              <motion.span
                key={`char-${wordIndex}-${charIndex}`}
                className="inline-block"
                aria-hidden="true"
                variants={charVariants}
              >
                {char}
              </motion.span>
            ))}
          </span>
        )
      })}
    </MotionTag>
  )
}
