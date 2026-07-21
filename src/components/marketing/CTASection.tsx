import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Route } from "next";

import { cn } from "@/lib/utils";
import { GradientText } from "@/components/animations/GradientText";
import { HeroIllustration } from "@/components/animations/HeroIllustration";
import { Magnetic } from "@/components/animations/Magnetic";
import { Reveal } from "@/components/animations/Reveal";

interface CTAConfig {
  label: string;
  href: string;
}

interface CTASectionProps {
  heading: string;
  description?: string;
  primary: CTAConfig;
  secondary?: CTAConfig;
  /** Theme của illustration trang trí ở góc. */
  illustration?: "sword" | "anemo" | "geo" | "constellation";
  className?: string;
}

export function CTASection({
  heading,
  description,
  primary,
  secondary,
  illustration = "constellation",
  className,
}: CTASectionProps) {
  return (
    <section
      className={cn(
        "relative w-full px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.18),transparent_60%)]"
      />

      {/* Hero illustration decoration */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 top-1/2 hidden -translate-y-1/2 opacity-50 lg:block"
      >
        <HeroIllustration theme={illustration} size={280} />
      </div>

      <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
        <Reveal>
          <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight text-balance text-white sm:text-4xl md:text-5xl lg:text-6xl">
            <GradientText
              gradient="linear-gradient(135deg,#ffffff 0%,#fde68a 50%,#f59e0b 100%)"
              className="block"
            >
              {heading}
            </GradientText>
          </h2>
        </Reveal>

        {description ? (
          <Reveal delay={0.15}>
            <p className="mt-5 max-w-2xl text-base text-pretty text-white/80 sm:text-lg md:text-xl">
              {description}
            </p>
          </Reveal>
        ) : null}

        <Reveal delay={0.3}>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <Magnetic strength={0.35}>
              <Link
                href={primary.href as Route}
                className={cn(
                  "group/cta relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full",
                  "bg-gradient-amber px-7 text-sm font-semibold text-white shadow-lg",
                  "transition-all hover-lift glow-amber pulse-glow",
                  "hover:shadow-xl focus-visible:outline-none focus-visible:ring-2",
                  "focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                )}
              >
                <span
                  aria-hidden
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover/cta:translate-x-full"
                />
                <span className="relative">{primary.label}</span>
                <ArrowRight
                  className="relative size-4 transition-transform group-hover/cta:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </Magnetic>

            {secondary ? (
              <Magnetic strength={0.3}>
                <Link
                  href={secondary.href as Route}
                  className={cn(
                    "inline-flex h-12 items-center justify-center gap-2 rounded-full",
                    "border border-white/40 bg-white/5 px-7 text-sm font-semibold text-white",
                    "backdrop-blur-md transition-all hover-lift",
                    "hover:border-white/80 hover:bg-white/10",
                    "focus-visible:outline-none focus-visible:ring-2",
                    "focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                  )}
                >
                  <span>{secondary.label}</span>
                </Link>
              </Magnetic>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default CTASection;
