import Link from "next/link";
import { ArrowRight, Sparkles, ChevronDown, Star, TrendingUp, Award } from "lucide-react";
import type { Route } from "next";

import { cn } from "@/lib/utils";
import { BlurReveal } from "@/components/animations/BlurReveal";
import { GradientText } from "@/components/animations/GradientText";
import { Reveal } from "@/components/animations/Reveal";
import { FloatingShapes } from "@/components/animations/FloatingShapes";
import { MeshGradient } from "@/components/animations/MeshGradient";
import { NoiseOverlay } from "@/components/animations/NoiseOverlay";
import { CountUp } from "@/components/shared/count-up";

export interface HeroStat {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  icon?: "star" | "users" | "shield" | "zap" | "thumbs" | "clock" | "trending" | "award";
}

interface HeroCta {
  label: string;
  href: string;
}

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  description?: string;
  ctaPrimary?: HeroCta;
  ctaSecondary?: HeroCta;
  badge?: string;
  stats?: HeroStat[];
  className?: string;
}

const ICON_BY_KEY: Record<NonNullable<HeroStat["icon"]>, typeof Star> = {
  star: Star,
  users: TrendingUp,
  shield: Star,
  zap: TrendingUp,
  thumbs: TrendingUp,
  clock: TrendingUp,
  trending: TrendingUp,
  award: Award,
};

export function HeroSection({
  title,
  subtitle,
  description,
  ctaPrimary,
  ctaSecondary,
  badge,
  stats,
  className,
}: HeroSectionProps) {
  return (
    <section
      className={cn(
        "relative min-h-[100svh] w-full",
        className
      )}
    >
      {/* Layer 1: Floating shapes (slow drift) */}
      <FloatingShapes
        className="absolute inset-0 -z-30 opacity-70"
        aria-hidden
      />

      {/* Layer 2: Mesh / aurora gradient (premium feel) */}
      <MeshGradient
        className="absolute inset-0 -z-20"
        count={3}
        intensity={0.6}
        aria-hidden
      />

      {/* Layer 3: Top radial highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem] bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.35),transparent_60%)]"
      />

      {/* Layer 4: Noise overlay for depth */}
      <NoiseOverlay opacity={0.05} className="-z-10" aria-hidden />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-32 pb-24 text-center sm:px-6 sm:pt-40 md:pt-48 lg:px-8">
        {badge ? (
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/10 px-4 py-1.5 text-xs font-medium text-foreground/90 backdrop-blur-md transition-colors hover:border-foreground/20 sm:text-sm">
              <Sparkles className="size-3.5 text-brand-amber" aria-hidden />
              <span>{badge}</span>
            </span>
          </Reveal>
        ) : null}

        <BlurReveal
          as="h1"
          className={cn(
            "mt-6 max-w-5xl font-heading font-bold tracking-tight text-balance",
            "text-5xl leading-[1.05] sm:text-6xl md:text-7xl lg:text-[5.5rem]"
          )}
        >
          {subtitle ? (
            <span className="block text-base font-medium text-muted-foreground sm:text-lg md:text-xl">
              {subtitle}
            </span>
          ) : null}
          <GradientText
            className="block"
            gradient="linear-gradient(135deg,#3b82f6 0%,#60a5fa 35%,#f59e0b 100%)"
          >
            {title}
          </GradientText>
        </BlurReveal>

        {description ? (
          <Reveal delay={0.3}>
            <p className="mt-6 max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg md:text-xl">
              {description}
            </p>
          </Reveal>
        ) : null}

        {(ctaPrimary || ctaSecondary) && (
          <Reveal delay={0.45}>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              {ctaPrimary ? (
                <Link
                  href={ctaPrimary.href as Route}
                  className={cn(
                    "group/cta relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full",
                    "bg-gradient-brand px-7 text-sm font-semibold text-white shadow-lg",
                    "transition-all hover-lift glow-blue",
                    "hover:shadow-xl focus-visible:outline-none focus-visible:ring-2",
                    "focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  )}
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover/cta:translate-x-full"
                  />
                  <span className="relative">{ctaPrimary.label}</span>
                  <ArrowRight className="relative size-4 transition-transform group-hover/cta:translate-x-0.5" />
                </Link>
              ) : null}

              {ctaSecondary ? (
                <Link
                  href={ctaSecondary.href as Route}
                  className={cn(
                    "inline-flex h-12 items-center justify-center gap-2 rounded-full",
                    "border border-border bg-card/10 px-7 text-sm font-semibold",
                    "text-foreground backdrop-blur-md transition-all hover-lift",
                    "hover:border-foreground/30 hover:bg-card/25",
                    "focus-visible:outline-none focus-visible:ring-2",
                    "focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  )}
                >
                  <span>{ctaSecondary.label}</span>
                </Link>
              ) : null}
            </div>
          </Reveal>
        )}

        {stats && stats.length > 0 ? (
          <Reveal delay={0.6}>
            <dl className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-y-8 rounded-2xl border border-border bg-card/5 px-4 py-6 backdrop-blur-sm sm:grid-cols-4 sm:px-6">
              {stats.map((stat) => {
                const Icon = stat.icon ? ICON_BY_KEY[stat.icon] : null;
                return (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center gap-1 px-2"
                  >
                    <dt className="order-2 text-xs font-medium text-muted-foreground sm:text-sm">
                      {stat.label}
                    </dt>
                    <dd className="order-1 flex items-center gap-1.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                      {Icon ? (
                        <Icon className="size-5 text-brand-amber/70 sm:size-6" aria-hidden />
                      ) : null}
                      <CountUp
                        end={stat.value}
                        prefix={stat.prefix}
                        suffix={stat.suffix}
                        decimals={stat.decimals}
                      />
                    </dd>
                  </div>
                );
              })}
            </dl>
          </Reveal>
        ) : null}

        {/* Scroll indicator */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center text-muted-foreground"
        >
          <div className="flex flex-col items-center gap-1 scroll-indicator">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em]">
              Cuộn xuống
            </span>
            <ChevronDown className="size-5" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;