"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/constants";

export interface PricingTier {
  id: string;
  name: string;
  desc: string;
  monthly: number;
  yearly: number;
  features: { text: string; yes: boolean }[];
  cta: string;
  highlight?: boolean;
}

export function PricingToggle({ tiers }: { tiers: PricingTier[] }) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const yearlyDiscount = 0.85; // 15% off

  return (
    <section className="max-w-6xl mx-auto">
      {/* Toggle */}
      <div className="flex items-center justify-center gap-2 mb-10">
        <span
          className={cn(
            "text-sm font-medium transition-colors",
            billing === "monthly" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          Theo tháng
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={billing === "yearly"}
          aria-label="Chuyển đổi thanh toán theo năm"
          onClick={() =>
            setBilling(billing === "monthly" ? "yearly" : "monthly")
          }
          className={cn(
            "relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            billing === "yearly" ? "bg-amber-500" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform",
              billing === "yearly" ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
        <span
          className={cn(
            "text-sm font-medium transition-colors flex items-center gap-2",
            billing === "yearly" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          Theo năm
          <Badge
            variant="outline"
            className="border-emerald-500/40 text-emerald-500"
          >
            -15%
          </Badge>
        </span>
      </div>

      {/* Tier cards */}
      <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
        {tiers.map((tier) => {
          const price =
            billing === "monthly"
              ? tier.monthly
              : Math.round(tier.yearly * yearlyDiscount);
          const perMonth =
            billing === "yearly"
              ? Math.round((tier.yearly * yearlyDiscount) / 12)
              : tier.monthly;

          return (
            <Card
              key={tier.id}
              className={cn(
                "hover-lift border-border/50 relative overflow-hidden",
                tier.highlight &&
                  "border-amber-500/50 shadow-2xl shadow-amber-500/10 lg:scale-105"
              )}
            >
              {tier.highlight && (
                <div className="absolute top-0 right-0 bg-gradient-amber text-black text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-bl-xl flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Phổ biến nhất
                </div>
              )}
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <p className="text-sm text-muted-foreground mb-6 min-h-[40px]">
                  {tier.desc}
                </p>

                <div className="mb-1">
                  <span className="text-4xl sm:text-5xl font-extrabold tracking-tight tabular-nums">
                    {formatCurrency(price)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  {billing === "yearly"
                    ? `${formatCurrency(perMonth)} / tháng (thanh toán ${formatCurrency(price)} / năm)`
                    : "/ tháng"}
                </p>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      {feat.yes ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                      )}
                      <span
                        className={cn(
                          !feat.yes && "text-muted-foreground/60 line-through"
                        )}
                      >
                        {feat.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href="/services" className="block">
                  <Button
                    className={cn(
                      "w-full",
                      tier.highlight &&
                        "bg-gradient-amber text-black hover:opacity-90 font-bold"
                    )}
                    variant={tier.highlight ? "default" : "outline"}
                  >
                    {tier.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
