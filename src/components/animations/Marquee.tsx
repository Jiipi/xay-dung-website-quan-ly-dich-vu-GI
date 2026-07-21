"use client"

import { useEffect, useRef, type ReactNode } from "react"
import {
  animate,
  motion,
  useMotionValue,
  type AnimationPlaybackControls,
} from "framer-motion"

import { useReducedMotion } from "@/lib/motion"
import { cn } from "@/lib/utils"

export interface MarqueeProps {
  children: ReactNode
  speed?: number
  pauseOnHover?: boolean
  direction?: "left" | "right"
  className?: string
}

export function Marquee({
  children,
  speed = 40,
  pauseOnHover = true,
  direction = "left",
  className,
}: MarqueeProps) {
  const prefersReducedMotion = useReducedMotion()
  const x = useMotionValue(direction === "left" ? "0%" : "-50%")
  const controlsRef = useRef<AnimationPlaybackControls | null>(null)

  useEffect(() => {
    const from = direction === "left" ? "0%" : "-50%"
    const to = direction === "left" ? "-50%" : "0%"

    x.set(from)

    if (prefersReducedMotion) return

    const controls = animate(x, to, {
      duration: Math.max(speed, 0.1),
      ease: "linear",
      repeat: Number.POSITIVE_INFINITY,
      repeatType: "loop",
    })

    controlsRef.current = controls

    return () => {
      controls.stop()
      controlsRef.current = null
    }
  }, [direction, prefersReducedMotion, speed, x])

  const pause = () => {
    if (pauseOnHover) controlsRef.current?.pause()
  }

  const play = () => {
    if (pauseOnHover) controlsRef.current?.play()
  }

  return (
    <div
      className={cn("overflow-hidden", className)}
      onPointerEnter={pause}
      onPointerLeave={play}
    >
      <motion.div className="flex w-max" style={{ x }}>
        <div className="flex shrink-0">{children}</div>
        <div aria-hidden="true" className="flex shrink-0">
          {children}
        </div>
      </motion.div>
    </div>
  )
}
