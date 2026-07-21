import type { Transition, Variants } from "framer-motion"

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -24 },
  visible: { opacity: 1, y: 0 },
}

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0 },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0 },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
}

export const staggerContainer: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

export const staggerItem: Variants = {
  ...fadeUp,
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

export const easeOutExpo: Transition = {
  duration: 0.7,
  ease: [0.16, 1, 0.3, 1],
}

export const easeSpring: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 24,
}

export const easeInOut: Transition = {
  duration: 0.4,
  ease: [0.4, 0, 0.2, 1],
}

export const DURATION = {
  fast: 0.2,
  base: 0.4,
  slow: 0.7,
  slower: 1.2,
} as const
