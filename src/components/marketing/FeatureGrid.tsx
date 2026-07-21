"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Award,
  BadgeCheck,
  Clock,
  Heart,
  Lock,
  Settings,
  Shield,
  Sparkles,
  Star,
  Swords,
  Timer,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  Zap,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "next";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Reveal } from "@/components/animations/Reveal";
import { GradientText } from "@/components/animations/GradientText";
import { TiltCard } from "@/components/animations/TiltCard";
import { staggerContainer, staggerItem } from "@/lib/motion";

type FeatureTone = "brand" | "amber" | "card";

export type FeatureIconKey =
  | "swords"
  | "timer"
  | "badge-check"
  | "lock"
  | "user-check"
  | "wallet"
  | "shield"
  | "users"
  | "trending-up"
  | "star"
  | "zap"
  | "clock"
  | "sparkles"
  | "target"
  | "heart"
  | "award"
  | "settings";

interface FeatureItem {
  iconName: FeatureIconKey;
  title: string;
  description: string;
  href?: string;
  tone?: FeatureTone;
}

interface FeatureGridProps {
  heading: string;
  subheading?: string;
  features: FeatureItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const ICON_MAP: Record<FeatureIconKey, LucideIcon> = {
  swords: Swords,
  timer: Timer,
  "badge-check": BadgeCheck,
  lock: Lock,
  "user-check": UserCheck,
  wallet: Wallet,
  shield: Shield,
  users: Users,
  "trending-up": TrendingUp,
  star: Star,
  zap: Zap,
  clock: Clock,
  sparkles: Sparkles,
  target: Target,
  heart: Heart,
  award: Award,
  settings: Settings,
};

const toneStyles: Record<FeatureTone, string> = {
  brand: "bg-gradient-brand text-white",
  amber: "bg-gradient-amber text-white",
  card: "bg-gradient-card text-brand-blue dark:text-brand-amber",
};

const columnsClassMap: Record<2 | 3 | 4, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function FeatureGrid({
  heading,
  subheading,
  features,
  columns = 3,
  className,
}: FeatureGridProps) {
  return (
    <section
      className={cn("relative w-full px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32", className)}
    >
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl">
            <GradientText>{heading}</GradientText>
          </h2>
          {subheading ? (
            <p className="mt-4 text-base text-pretty text-muted-foreground sm:text-lg">
              {subheading}
            </p>
          ) : null}
        </Reveal>

        <motion.div
          className={cn("mt-12 grid gap-6 sm:gap-8", columnsClassMap[columns])}
          variants={staggerContainer}
          initial="hidden"
          viewport={{ once: true, margin: "-10% 0px" }}
          whileInView="visible"
        >
          {features.map((feature) => {
            const tone: FeatureTone = feature.tone ?? "card";
            const Icon = ICON_MAP[feature.iconName] ?? Sparkles;

            const cardBody = (
              <motion.div
                variants={staggerItem}
                className="tilt-card relative h-full"
              >
                <div
                  className={cn(
                    "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/40 p-6",
                    "backdrop-blur-sm transition-all duration-300 hover-lift",
                    "hover:border-brand-blue/40 hover:bg-card/70 hover:shadow-xl",
                    "dark:hover:border-brand-amber/40"
                  )}
                >
                  <span
                    aria-hidden
                    className="tilt-highlight pointer-events-none absolute inset-0"
                  />

                  <div className="relative">
                    <div
                      className={cn(
                        "inline-flex size-12 items-center justify-center rounded-xl",
                        "shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/10",
                        toneStyles[tone]
                      )}
                    >
                      <Icon className="size-6" aria-hidden />
                    </div>

                    <h3 className="mt-5 font-heading text-lg font-semibold text-foreground sm:text-xl">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {feature.description}
                    </p>

                    {feature.href ? (
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-blue transition-colors group-hover:text-brand-amber dark:text-brand-amber">
                        Tìm hiểu thêm
                        <ArrowUpRight
                          className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </span>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            );

            return (
              <TiltCard key={feature.title} maxRotation={5} className="h-full">
                {feature.href ? (
                  <Link href={feature.href as Route} className="block h-full">
                    {cardBody}
                  </Link>
                ) : (
                  cardBody
                )}
              </TiltCard>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

export default FeatureGrid;