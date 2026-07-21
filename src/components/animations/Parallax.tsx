"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"

import { useMouseParallax, useReducedMotion } from "@/lib/motion"
import { cn } from "@/lib/utils"

export interface ParallaxProps {
  children: ReactNode
  strength?: number
  className?: string
}

export function Parallax({
  children,
  strength = 0.1,
  className,
}: ParallaxProps) {
  const { x, y, ref: containerRef } = useMouseParallax(strength)
  const prefersReducedMotion = useReducedMotion()

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <motion.div style={prefersReducedMotion ? undefined : { x, y }}>
        {children}
      </motion.div>
    </div>
  )
}
