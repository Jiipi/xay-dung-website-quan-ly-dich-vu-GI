"use client"

import { useRef, type PointerEvent, type ReactNode } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

import { useReducedMotion } from "@/lib/motion"
import { cn } from "@/lib/utils"

export interface MagneticProps {
  children: ReactNode
  strength?: number
  className?: string
}

export function Magnetic({
  children,
  strength = 0.3,
  className,
}: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const targetX = useMotionValue(0)
  const targetY = useMotionValue(0)
  const x = useSpring(targetX, { stiffness: 240, damping: 20, mass: 0.4 })
  const y = useSpring(targetY, { stiffness: 240, damping: 20, mass: 0.4 })

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !ref.current) return

    const bounds = ref.current.getBoundingClientRect()
    const offsetX = event.clientX - (bounds.left + bounds.width / 2)
    const offsetY = event.clientY - (bounds.top + bounds.height / 2)

    targetX.set(offsetX * strength)
    targetY.set(offsetY * strength)
  }

  const resetPosition = () => {
    targetX.set(0)
    targetY.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={cn("inline-block", className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPosition}
      style={{ x, y }}
    >
      {children}
    </motion.div>
  )
}
