"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Marquee } from "@/components/animations/Marquee";
import { Reveal } from "@/components/animations/Reveal";

interface LogoItem {
  name: string;
  imageUrl?: string;
  fallback?: string;
}

interface LogoCloudProps {
  title?: string;
  logos: LogoItem[];
  speed?: number;
  pauseOnHover?: boolean;
  className?: string;
}

const LogoMark = ({ logo }: { logo: LogoItem }) => {
  const initial = (logo.fallback ?? logo.name).trim().charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "flex h-14 w-44 items-center justify-center gap-2 rounded-xl border border-border/50 bg-card/40 px-4 py-2",
        "backdrop-blur-sm transition-all",
        "hover:border-brand-blue/40 dark:hover:border-brand-amber/40"
      )}
      aria-label={logo.name}
      role="img"
    >
      {logo.imageUrl ? (
        <Image
          src={logo.imageUrl}
          alt={logo.name}
          width={120}
          height={32}
          unoptimized
          className="h-7 w-auto max-w-[120px] object-contain"
        />
      ) : (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-md",
              "bg-gradient-brand text-sm font-bold text-white"
            )}
            aria-hidden
          >
            {initial}
          </span>
          <span className="text-sm font-semibold text-foreground/80">
            {logo.name}
          </span>
        </div>
      )}
    </div>
  );
};

export function LogoCloud({
  title,
  logos,
  speed = 30,
  pauseOnHover = true,
  className,
}: LogoCloudProps) {
  if (logos.length === 0) return null;

  const half = Math.ceil(logos.length / 2);
  const firstRow = logos.slice(0, half);
  const secondRow = logos.slice(half);

  return (
    <section
      className={cn(
        "relative w-full px-4 py-16 sm:px-6 sm:py-20 lg:px-8",
        className
      )}
    >
      <div className="mx-auto max-w-6xl">
        {title ? (
          <Reveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:text-sm">
              {title}
            </p>
          </Reveal>
        ) : null}

        <Reveal delay={0.15}>
        <div className="relative mt-8 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
          <Marquee
            speed={speed}
            pauseOnHover={pauseOnHover}
            className="grayscale transition-all hover:grayscale-0"
          >
            {firstRow.map((logo) => (
              <LogoMark key={`row1-${logo.name}`} logo={logo} />
            ))}
          </Marquee>
        </div>
        </Reveal>

        {secondRow.length > 0 ? (
          <Reveal delay={0.25}>
            <div className="relative mt-6 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
              <Marquee
                speed={speed}
                pauseOnHover={pauseOnHover}
                direction="right"
                className="grayscale transition-all hover:grayscale-0"
              >
                {secondRow.map((logo) => (
                  <LogoMark key={`row2-${logo.name}`} logo={logo} />
                ))}
              </Marquee>
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}

export default LogoCloud;
