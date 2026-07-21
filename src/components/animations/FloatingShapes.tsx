"use client"

import { useMemo, type CSSProperties } from "react"

import { useReducedMotion } from "@/lib/motion"
import { cn } from "@/lib/utils"

export interface FloatingShapesProps {
  count?: number
  className?: string
}

interface FloatingShape {
  id: number
  size: number
  top: number
  left: number
  duration: number
  delay: number
  opacity: number
  gradientClassName: "bg-gradient-brand" | "bg-gradient-amber"
}

export function FloatingShapes({
  count = 5,
  className,
}: FloatingShapesProps) {
  const prefersReducedMotion = useReducedMotion()
  const shapes = useMemo(
    () => createShapes(Math.max(0, Math.floor(count))),
    [count],
  )

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {shapes.map((shape) => {
        const style: CSSProperties = {
          width: shape.size,
          height: shape.size,
          top: `${shape.top}%`,
          left: `${shape.left}%`,
          opacity: shape.opacity,
          animation: prefersReducedMotion
            ? undefined
            : `float ${shape.duration}s ease-in-out ${shape.delay}s infinite`,
        }

        return (
          <span
            key={shape.id}
            className={cn(
              "absolute block rounded-full blur-3xl will-change-transform",
              shape.gradientClassName,
            )}
            style={style}
          />
        )
      })}
    </div>
  )
}

function createShapes(count: number): FloatingShape[] {
  let seed = count * 1_009 + 17
  const random = () => {
    seed = (seed * 16_807) % 2_147_483_647
    return (seed - 1) / 2_147_483_646
  }

  return Array.from({ length: count }, (_, index) => ({
    id: index,
    size: Math.round(140 + random() * 260),
    top: Math.round(-15 + random() * 100),
    left: Math.round(-15 + random() * 100),
    duration: Math.round(12 + random() * 12),
    delay: Math.round(random() * -10),
    opacity: 0.12 + random() * 0.16,
    gradientClassName:
      random() > 0.45 ? "bg-gradient-brand" : "bg-gradient-amber",
  }))
}
