"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users, Award, Zap, LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { CountUp } from "@/components/shared/count-up";
import { Reveal } from "@/components/animations/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";

type StatFormat = "int" | "currency";
type StatIconKey = "trending" | "users" | "award" | "zap" | "shield";

export interface StatItem {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  format?: StatFormat;
  decimals?: number;
  icon?: StatIconKey;
}

interface StatBarProps {
  heading?: string;
  description?: string;
  stats: StatItem[];
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

const columnsClassMap: Record<2 | 3 | 4 | 5, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
};

const iconMap: Record<StatIconKey, LucideIcon> = {
  trending: TrendingUp,
  users: Users,
  award: Award,
  zap: Zap,
  shield: Award,
};

const iconColorMap: Record<StatIconKey, string> = {
  trending: "text-brand-blue",
  users: "text-brand-amber",
  award: "text-emerald-500",
  zap: "text-amber-500",
  shield: "text-brand-blue",
};

const formatCurrency = (value: number) => {
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return value.toLocaleString("vi-VN");
  }
};

export function StatBar({
  heading,
  description,
  stats,
  columns = 4,
  className,
}: StatBarProps) {
  return (
    <section
      className={cn("relative w-full px-4 py-16 sm:px-6 sm:py-20 lg:px-8", className)}
    >
      <div className="mx-auto max-w-6xl">
        {(heading || description) && (
          <Reveal className="mx-auto mb-10 max-w-2xl text-center">
            {heading ? (
              <h2 className="font-heading text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                {heading}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-2 text-sm text-pretty text-muted-foreground sm:text-base">
                {description}
              </p>
            ) : null}
          </Reveal>
        )}

        <motion.div
          className={cn(
            "grid items-stretch gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/40 glass-light",
            "dark:bg-border/30",
            columnsClassMap[columns]
          )}
          variants={staggerContainer}
          initial="hidden"
          viewport={{ once: true, margin: "-10% 0px" }}
          whileInView="visible"
        >
          {stats.map((stat) => {
            const decimals =
              stat.decimals ?? (stat.format === "currency" ? 0 : 0);
            const display = (value: number) =>
              stat.format === "currency" ? formatCurrency(value) : value;
            const Icon = stat.icon ? iconMap[stat.icon] : null;
            const iconColor = stat.icon ? iconColorMap[stat.icon] : "";

            return (
              <motion.div
                key={stat.label}
                variants={staggerItem}
                className="group relative bg-background/70 p-6 text-center backdrop-blur-md transition-colors hover:bg-background/90 sm:p-8"
              >
                {Icon ? (
                  <Icon
                    className={cn(
                      "mx-auto mb-3 size-7 transition-transform duration-300 group-hover:scale-110",
                      iconColor
                    )}
                    aria-hidden
                  />
                ) : null}
                <p className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                  <CountUp
                    end={stat.value}
                    decimals={decimals}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    formatValue={display}
                  />
                </p>
                <p className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:text-sm">
                  {stat.label}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

export default StatBar;
