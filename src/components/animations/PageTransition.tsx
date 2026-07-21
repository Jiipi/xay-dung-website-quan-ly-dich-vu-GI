"use client"

import type { ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { usePathname } from "next/navigation"

import { useReducedMotion } from "@/lib/motion"
import { cn } from "@/lib/utils"

export interface PageTransitionProps {
  children: ReactNode
  className?: string
}

/**
 * Wrapper fade + blur cho nội dung page, tự replay khi `pathname` đổi.
 * Đặt ở cuối mỗi `page.tsx` (hoặc trong `(group)/layout.tsx`).
 *
 * Khi `prefers-reduced-motion`: render thẳng children, không animate.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname()
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={cn(className)}>{children}</div>
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, filter: "blur(8px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, filter: "blur(8px)" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn(className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
