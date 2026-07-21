"use client"

import type { CSSProperties, ReactNode } from "react"

import { useReducedMotion } from "@/lib/motion"
import { cn } from "@/lib/utils"

export interface GradientTextProps {
  children: ReactNode
  className?: string
  gradient?: string
  speed?: number
}

export function GradientText({
  children,
  className,
  gradient = "linear-gradient(90deg, #3b82f6, #f59e0b, #3b82f6)",
  speed = 3,
}: GradientTextProps) {
  const prefersReducedMotion = useReducedMotion()
  const style: CSSProperties = {
    backgroundImage: gradient,
    backgroundSize: "200% auto",
    backgroundPosition: "0% 50%",
    animation: prefersReducedMotion
      ? undefined
      : `gradient-shift ${Math.max(speed, 0.1)}s linear infinite`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  }

  return (
    <span className={cn("inline-block text-transparent", className)} style={style}>
      {children}
    </span>
  )
}
