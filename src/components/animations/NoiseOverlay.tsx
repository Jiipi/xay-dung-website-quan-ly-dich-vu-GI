"use client"

import { useId } from "react"

import { useReducedMotion } from "@/lib/motion"
import { cn } from "@/lib/utils"

export interface NoiseOverlayProps {
  /**
   * Độ trong suốt của lớp noise (0-1). Mặc định 0.06 — đủ thấy
   * nhưng không gây rối mắt.
   */
  opacity?: number
  /** Tần số của turbulence (cao → hạt nhỏ hơn). Mặc định 0.85. */
  frequency?: number
  className?: string
  /**
   * Chế độ blend với nội dung phía dưới. Mặc định `overlay`.
   */
  blendMode?: "overlay" | "soft-light" | "multiply" | "screen"
}

/**
 * Lớp phủ noise grain sử dụng SVG `feTurbulence`. Tăng chiều sâu cho
 * gradient/phối màu phẳng, tránh banding khi hiển thị gradient
 * trên màn hình giá rẻ.
 *
 * Không phụ thuộc asset ngoài (render inline SVG).
 */
export function NoiseOverlay({
  opacity = 0.06,
  frequency = 0.85,
  className,
  blendMode = "overlay",
}: NoiseOverlayProps) {
  const prefersReducedMotion = useReducedMotion()
  const id = useId().replace(/:/g, "")

  if (prefersReducedMotion) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        opacity,
        mixBlendMode: blendMode,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
      >
        <filter id={`noise-${id}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency={frequency}
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#noise-${id})`} />
      </svg>
    </div>
  )
}
