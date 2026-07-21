"use client"

import { useRef, type PointerEvent, type ReactNode } from "react"
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion"

import { useReducedMotion } from "@/lib/motion"
import { cn } from "@/lib/utils"

export interface TiltCardProps {
  children: ReactNode
  /**
   * Cường độ xoay tối đa (độ). Mặc định 6 — đủ nổi bật nhưng không
   * gây khó chịu. Tăng lên 8-10 nếu muốn "wow" hơn.
   */
  maxRotation?: number
  /**
   * Độ nảy khi di chuột vào/ra (spring). Mặc định 200/20.
   */
  className?: string
}

/**
 * Card 3D tilt nhẹ theo con trỏ. Wrap children vào một perspective
 * container; nội dung sẽ rotateX/Y theo vị trí chuột, đồng thời có
 * highlight gradient xuất hiện ở góc chuột chạm.
 *
 * Tôn trọng `prefers-reduced-motion`: render thẳng children.
 */
export function TiltCard({
  children,
  maxRotation = 6,
  className,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  const springConfig = { stiffness: 200, damping: 20, mass: 0.4 }
  const x = useSpring(useTransform(mouseX, [0, 1], [-maxRotation, maxRotation]), springConfig)
  const y = useSpring(useTransform(mouseY, [0, 1], [maxRotation, -maxRotation]), springConfig)

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !ref.current) return
    const bounds = ref.current.getBoundingClientRect()
    const xPct = (event.clientX - bounds.left) / bounds.width
    const yPct = (event.clientY - bounds.top) / bounds.height
    mouseX.set(Math.min(Math.max(xPct, 0), 1))
    mouseY.set(Math.min(Math.max(yPct, 0), 1))
  }

  const handlePointerLeave = () => {
    mouseX.set(0.5)
    mouseY.set(0.5)
  }

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn("relative", className)}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        style={
          prefersReducedMotion
            ? undefined
            : {
                rotateX: y,
                rotateY: x,
                transformStyle: "preserve-3d",
              }
        }
        className="will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  )
}
