"use client"

import type { ComponentType, JSX, ReactNode } from "react"
import {
  motion,
  type MotionProps,
  type Variants,
} from "framer-motion"

import { fadeUp } from "@/lib/motion"
import { cn } from "@/lib/utils"

export interface RevealProps {
  children: ReactNode
  variants?: Variants
  delay?: number
  className?: string
  as?: keyof JSX.IntrinsicElements
  once?: boolean
}

export function Reveal({
  children,
  variants = fadeUp,
  delay = 0,
  className,
  as = "div",
  once = true,
}: RevealProps) {
  const MotionComponent = motion[as as keyof typeof motion] as ComponentType<
    MotionProps & {
      children?: ReactNode
      className?: string
    }
  >

  return (
    <MotionComponent
      className={cn(className)}
      initial="hidden"
      variants={variants}
      viewport={{ once, margin: "-10% 0px" }}
      whileInView="visible"
      transition={{ delay }}
    >
      {children}
    </MotionComponent>
  )
}
