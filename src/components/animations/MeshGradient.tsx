"use client"

import type { CSSProperties } from "react"

import { useReducedMotion } from "@/lib/motion"
import { cn } from "@/lib/utils"

export interface MeshGradientProps {
  className?: string
  /** Số lượng blob gradient (mặc định 3) */
  count?: 2 | 3 | 4
  /** Độ rõ của các blob (0-1, mặc định 0.5) */
  intensity?: number
  /**
   * Bật hiệu ứng drift chậm liên tục (mặc định true). Tự tắt nếu
   * `prefers-reduced-motion: reduce`.
   */
  animated?: boolean
}

interface BlobConfig {
  position: string
  size: string
  color: string
  duration: string
  delay: string
}

/**
 * Animated mesh / aurora background: 3-4 radial gradient blobs di chuyển
 * chậm liên tục để tạo cảm giác "premium gradient". Dùng CSS keyframes
 * `gradient-shift` đã có sẵn trong globals.css.
 *
 * Phù hợp cho HeroSection, CTASection — đặt `position: absolute inset-0 -z-10`.
 */
export function MeshGradient({
  className,
  count = 3,
  intensity = 0.5,
  animated = true,
}: MeshGradientProps) {
  const prefersReducedMotion = useReducedMotion()
  const blobs = buildBlobs(count, intensity, animated && !prefersReducedMotion)

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {blobs.map((blob, index) => {
        const style: CSSProperties = {
          background: blob.color,
          width: blob.size,
          height: blob.size,
          top: blob.position,
          left: blob.position,
          animation: blob.duration
            ? `gradient-shift ${blob.duration} ease-in-out ${blob.delay} infinite alternate`
            : undefined,
        }
        return (
          <span
            key={index}
            className="absolute rounded-full blur-[120px] will-change-transform"
            style={style}
          />
        )
      })}
    </div>
  )
}

function buildBlobs(
  count: 2 | 3 | 4,
  intensity: number,
  animated: boolean,
): BlobConfig[] {
  const palettes: { color: string; position: string; size: string }[] = [
    {
      color: `radial-gradient(circle at 30% 30%, rgba(59,130,246,${0.55 * intensity}) 0%, transparent 65%)`,
      position: "-10% -20%",
      size: "55vw",
    },
    {
      color: `radial-gradient(circle at 70% 70%, rgba(245,158,11,${0.5 * intensity}) 0%, transparent 65%)`,
      position: "10% 30%",
      size: "50vw",
    },
    {
      color: `radial-gradient(circle at 50% 50%, rgba(99,102,241,${0.45 * intensity}) 0%, transparent 70%)`,
      position: "30% 50%",
      size: "60vw",
    },
    {
      color: `radial-gradient(circle at 20% 80%, rgba(236,72,153,${0.35 * intensity}) 0%, transparent 70%)`,
      position: "50% 60%",
      size: "45vw",
    },
  ]

  const timings = [
    { duration: "18s", delay: "0s" },
    { duration: "22s", delay: "-4s" },
    { duration: "26s", delay: "-8s" },
    { duration: "30s", delay: "-12s" },
  ]

  return palettes.slice(0, count).map((palette, index) => ({
    ...palette,
    duration: animated ? timings[index]!.duration : "0s",
    delay: animated ? timings[index]!.delay : "0s",
  }))
}
