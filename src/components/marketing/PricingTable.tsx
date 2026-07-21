"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import type { Route } from "next";

import { cn } from "@/lib/utils";
import { GradientText } from "@/components/animations/GradientText";
import { Reveal } from "@/components/animations/Reveal";
import { Switch } from "@/components/ui/switch";

interface PricingCta {
  label: string;
  href: string;
}

interface PricingTier {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency?: string;
  features: string[];
  cta: PricingCta;
  highlighted?: boolean;
  badge?: string;
}

interface PricingTableProps {
  heading: string;
  subheading?: string;
  tiers: PricingTier[];
  defaultPeriod?: "monthly" | "yearly";
  className?: string;
}

const formatPrice = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString("vi-VN")} ${currency}`;
  }
};

export function PricingTable({
  heading,
  subheading,
  tiers,
  defaultPeriod = "monthly",
  className,
}: PricingTableProps) {
  const [period, setPeriod] = useState<"monthly" | "yearly">(defaultPeriod);
  const isYearly = period === "yearly";

  return (
    <section
      className={cn("relative w-full px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32", className)}
    >
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            <GradientText>{heading}</GradientText>
          </h2>
          {subheading ? (
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              {subheading}
            </p>
          ) : null}
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-10 flex items-center justify-center gap-3">
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                !isYearly ? "text-foreground" : "text-muted-foreground"
              )}
              id="pricing-period-monthly"
            >
              Theo tháng
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={(checked) =>
                setPeriod(checked ? "yearly" : "monthly")
              }
              aria-labelledby="pricing-period-monthly pricing-period-yearly"
            />
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                isYearly ? "text-foreground" : "text-muted-foreground"
              )}
              id="pricing-period-yearly"
            >
              Theo năm
            </span>
            <span
              className={cn(
                "ml-2 rounded-full bg-brand-amber/15 px-2.5 py-0.5 text-xs font-semibold text-brand-amber",
                "ring-1 ring-inset ring-brand-amber/30"
              )}
            >
              Tiết kiệm 20%
            </span>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier, idx) => {
            const priceValue = isYearly ? tier.yearlyPrice : tier.monthlyPrice;
            const currency = tier.currency ?? "VND";

            return (
              <Reveal key={tier.name} delay={idx * 0.1}>
                <div
                  className={cn(
                    "relative flex h-full flex-col rounded-2xl border bg-card/60 p-6 backdrop-blur-md transition-all",
                    "hover-lift",
                    tier.highlighted
                      ? "border-transparent glow-blue"
                      : "border-border/60 hover:border-brand-blue/40 dark:hover:border-brand-amber/40"
                  )}
                >
                  {tier.highlighted ? (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -inset-px rounded-2xl bg-[conic-gradient(from_140deg,#3b82f6,#f59e0b,#3b82f6)] opacity-90 [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude] [-webkit-mask-composite:xor] [-webkit-mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] p-px"
                    />
                  ) : null}

                  {tier.highlighted || tier.badge ? (
                    <span
                      className={cn(
                        "absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-sm",
                        tier.highlighted
                          ? "bg-gradient-brand text-white"
                          : "bg-brand-amber text-white"
                      )}
                    >
                      <Sparkles className="size-3" aria-hidden />
                      {tier.badge ?? "Phổ biến nhất"}
                    </span>
                  ) : null}

                  <div className="relative">
                    <h3 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                      {tier.name}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {tier.description}
                    </p>

                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={priceValue}
                            initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                            transition={{ duration: 0.25 }}
                            className="inline-block"
                          >
                            <GradientText>
                              {formatPrice(priceValue, currency)}
                            </GradientText>
                          </motion.span>
                        </AnimatePresence>
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">
                        /{isYearly ? "năm" : "tháng"}
                      </span>
                    </div>

                    <ul className="mt-6 space-y-3 text-sm">
                      {tier.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-foreground/85"
                        >
                          <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue dark:bg-brand-amber/15 dark:text-brand-amber">
                            <Check className="size-3" aria-hidden />
                          </span>
                          <span className="leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={tier.cta.href as Route}
                      className={cn(
                        "mt-8 inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        tier.highlighted
                          ? "bg-gradient-brand text-white shadow-md hover-lift glow-blue"
                          : "border border-border bg-background text-foreground hover:border-brand-blue hover:text-brand-blue dark:hover:border-brand-amber dark:hover:text-brand-amber"
                      )}
                    >
                      {tier.cta.label}
                    </Link>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default PricingTable;
