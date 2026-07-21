"use client"

import { motion, type Variants } from "framer-motion"

import { useReducedMotion } from "@/lib/motion"
import { cn } from "@/lib/utils"

export type IllustrationTheme = "sword" | "anemo" | "geo" | "constellation"

export interface HeroIllustrationProps {
  theme?: IllustrationTheme
  className?: string
  /** Kích thước SVG (px). Mặc định 320. */
  size?: number
}

const strokeVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (custom: { delay: number; duration: number }) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        delay: custom.delay,
        duration: custom.duration,
        ease: [0.22, 1, 0.36, 1],
      },
      opacity: {
        delay: custom.delay,
        duration: 0.2,
      },
    },
  }),
}

const glowVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (custom: { delay: number }) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: custom.delay, duration: 1.2, ease: "easeOut" },
  }),
}

const colorByTheme: Record<IllustrationTheme, { stroke: string; glow: string }> = {
  sword: { stroke: "#f59e0b", glow: "rgba(245,158,11,0.45)" },
  anemo: { stroke: "#60a5fa", glow: "rgba(96,165,250,0.45)" },
  geo: { stroke: "#fbbf24", glow: "rgba(251,191,36,0.4)" },
  constellation: { stroke: "#a78bfa", glow: "rgba(167,139,250,0.45)" },
}

/**
 * Minh hoạ SVG dạng animation nhỏ cho Hero/CTA: tuỳ theme sẽ render
 * kiếm + glow (sword), lá gió anemo (anemo), địa cầu geo (geo) hoặc
 * chòm sao (constellation). Tất cả stroke path dùng framer-motion
 * `pathLength` để vẽ dần khi vào viewport.
 *
 * Tôn trọng `prefers-reduced-motion`: render thẳng path.
 */
export function HeroIllustration({
  theme = "sword",
  className,
  size = 320,
}: HeroIllustrationProps) {
  const prefersReducedMotion = useReducedMotion()
  const { stroke, glow } = colorByTheme[theme]

  return (
    <motion.svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label={`Genshin77 hero illustration (${theme})`}
      className={cn("drop-shadow-2xl", className)}
      initial="hidden"
      viewport={{ once: true, margin: "-10% 0px" }}
      whileInView="visible"
    >
      <defs>
        <radialGradient id={`hero-glow-${theme}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glow} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Glow background */}
      <motion.circle
        cx="100"
        cy="100"
        r="90"
        fill={`url(#hero-glow-${theme})`}
        variants={glowVariants}
        custom={{ delay: 0 }}
        style={{ filter: "blur(2px)" }}
      />

      {theme === "sword" && <SwordArt stroke={stroke} />}
      {theme === "anemo" && <AnemoArt stroke={stroke} />}
      {theme === "geo" && <GeoArt stroke={stroke} />}
      {theme === "constellation" && <ConstellationArt stroke={stroke} />}

      {!prefersReducedMotion && (
        <motion.circle
          cx="100"
          cy="100"
          r="78"
          fill="none"
          stroke={stroke}
          strokeOpacity="0.35"
          strokeWidth="0.6"
          strokeDasharray="2 4"
          variants={strokeVariants}
          custom={{ delay: 0.6, duration: 1.5 }}
        />
      )}
    </motion.svg>
  )
}

interface ArtProps {
  stroke: string
}

function SwordArt({ stroke }: ArtProps) {
  return (
    <g
      fill="none"
      stroke={stroke}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.path
        d="M100 18 L100 150"
        variants={strokeVariants}
        custom={{ delay: 0.2, duration: 1.2 }}
      />
      <motion.path
        d="M70 70 L130 70"
        variants={strokeVariants}
        custom={{ delay: 0.6, duration: 0.5 }}
      />
      <motion.path
        d="M88 70 L88 150 M112 70 L112 150"
        variants={strokeVariants}
        custom={{ delay: 0.8, duration: 0.6 }}
      />
      <motion.circle
        cx="100"
        cy="60"
        r="6"
        variants={strokeVariants}
        custom={{ delay: 1.1, duration: 0.4 }}
      />
      <motion.path
        d="M55 165 Q100 150 145 165"
        variants={strokeVariants}
        custom={{ delay: 1.2, duration: 0.6 }}
      />
    </g>
  )
}

function AnemoArt({ stroke }: ArtProps) {
  return (
    <g fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round">
      <motion.path
        d="M30 100 Q70 60 100 100 T170 100"
        variants={strokeVariants}
        custom={{ delay: 0.2, duration: 1.4 }}
      />
      <motion.path
        d="M30 130 Q70 90 100 130 T170 130"
        variants={strokeVariants}
        custom={{ delay: 0.5, duration: 1.4 }}
      />
      <motion.path
        d="M30 70 Q70 30 100 70 T170 70"
        variants={strokeVariants}
        custom={{ delay: 0.8, duration: 1.4 }}
      />
      <motion.circle cx="100" cy="100" r="10" variants={strokeVariants} custom={{ delay: 1.2, duration: 0.4 }} />
    </g>
  )
}

function GeoArt({ stroke }: ArtProps) {
  return (
    <g fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round">
      <motion.path
        d="M100 30 L160 70 L160 130 L100 170 L40 130 L40 70 Z"
        variants={strokeVariants}
        custom={{ delay: 0.2, duration: 1.5 }}
      />
      <motion.path
        d="M100 30 L100 170 M40 70 L160 130 M160 70 L40 130"
        variants={strokeVariants}
        custom={{ delay: 0.6, duration: 1 }}
      />
      <motion.circle cx="100" cy="100" r="14" variants={strokeVariants} custom={{ delay: 1.2, duration: 0.4 }} />
    </g>
  )
}

function ConstellationArt({ stroke }: ArtProps) {
  const stars: [number, number][] = [
    [40, 50],
    [80, 30],
    [130, 60],
    [160, 110],
    [110, 150],
    [60, 130],
    [100, 90],
  ]
  const lines = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 0],
    [6, 1],
    [6, 4],
  ]
  return (
    <g>
      {lines.map(([a, b], idx) => (
        <motion.line
          key={`line-${idx}`}
          x1={stars[a]![0]}
          y1={stars[a]![1]}
          x2={stars[b]![0]}
          y2={stars[b]![1]}
          stroke={stroke}
          strokeWidth="1"
          variants={strokeVariants}
          custom={{ delay: 0.2 + idx * 0.1, duration: 0.8 }}
        />
      ))}
      {stars.map(([x, y], idx) => (
        <motion.circle
          key={`star-${idx}`}
          cx={x}
          cy={y}
          r="2.5"
          fill={stroke}
          variants={glowVariants}
          custom={{ delay: 1 + idx * 0.08 }}
        />
      ))}
    </g>
  )
}
