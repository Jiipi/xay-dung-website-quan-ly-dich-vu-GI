"use client"

import { useEffect, useRef, useState, type RefObject } from "react"
import {
  useInView,
  useMotionValue,
  useScroll,
  type UseInViewOptions,
} from "framer-motion"

export interface UseInViewOnceOptions
  extends Omit<UseInViewOptions, "once"> {
  ref?: RefObject<Element | null>
}

export function useScrollProgress() {
  const { scrollYProgress } = useScroll()

  return { scrollYProgress }
}

export function useMouseParallax(strength = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  useEffect(() => {
    const element = ref.current

    if (!element) return

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = element.getBoundingClientRect()
      const offsetX = event.clientX - (bounds.left + bounds.width / 2)
      const offsetY = event.clientY - (bounds.top + bounds.height / 2)

      x.set(offsetX * strength)
      y.set(offsetY * strength)
    }

    const resetPosition = () => {
      x.set(0)
      y.set(0)
    }

    element.addEventListener("pointermove", handlePointerMove)
    element.addEventListener("pointerleave", resetPosition)

    return () => {
      element.removeEventListener("pointermove", handlePointerMove)
      element.removeEventListener("pointerleave", resetPosition)
    }
  }, [strength, x, y])

  return { x, y, ref }
}

export function useInViewOnce(options: UseInViewOnceOptions = {}): boolean {
  const fallbackRef = useRef<Element>(null)
  const { ref = fallbackRef, ...inViewOptions } = options

  return useInView(ref, { ...inViewOptions, once: true })
}

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)

    updatePreference()
    mediaQuery.addEventListener("change", updatePreference)

    return () => mediaQuery.removeEventListener("change", updatePreference)
  }, [])

  return prefersReducedMotion
}
