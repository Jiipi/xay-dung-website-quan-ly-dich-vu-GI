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

const GENSHIN_ICONS: Record<
  string,
  { imageSrc: string; color: string; label: string; element?: string }
> = {
  MONDSTADT: {
    label: "MONDSTADT",
    element: "Phong (Anemo) 🌪️",
    color: "#74E5BB",
    imageSrc: "/images/elements/anemo.png",
  },
  LIYUE: {
    label: "LIYUE",
    element: "Nham (Geo) 🪨",
    color: "#FFE16B",
    imageSrc: "/images/elements/geo.png",
  },
  INAZUMA: {
    label: "INAZUMA",
    element: "Lôi (Electro) ⚡",
    color: "#E08EFF",
    imageSrc: "/images/elements/electro.png",
  },
  SUMERU: {
    label: "SUMERU",
    element: "Thảo (Dendro) 🌿",
    color: "#A5EE44",
    imageSrc: "/images/elements/dendro.png",
  },
  FONTAINE: {
    label: "FONTAINE",
    element: "Thủy (Hydro) 💧",
    color: "#4CC9FF",
    imageSrc: "/images/elements/hydro.png",
  },
  NATLAN: {
    label: "NATLAN",
    element: "Hỏa (Pyro) 🔥",
    color: "#FF6B4A",
    imageSrc: "/images/elements/pyro.png",
  },
  SNEZHNAYA: {
    label: "SNEZHNAYA",
    element: "Băng (Cryo) ❄️",
    color: "#99F5FF",
    imageSrc: "/images/elements/cryo.png",
  },
  GENSHIN: {
    label: "GENSHIN IMPACT",
    element: "Primogem ✦",
    color: "#F59E0B",
    imageSrc: "/images/elements/primogem.png",
  },
  HOYOVERSE: {
    label: "HOYOVERSE",
    element: "Official Game 🌌",
    color: "#3B82F6",
    imageSrc: "/images/elements/genshin-logo.png",
  },
  STARRAIL: {
    label: "STAR RAIL",
    element: "Honkai 🚀",
    color: "#C084FC",
    imageSrc: "/images/elements/primogem.png",
  },
  TEYVAT: {
    label: "TEYVAT",
    element: "World 🗺️",
    color: "#34D399",
    imageSrc: "/images/elements/anemo.png",
  },
};

const LogoMark = ({ logo }: { logo: LogoItem }) => {
  const key = logo.name.toUpperCase().replace(/\s+/g, "");
  const found =
    GENSHIN_ICONS[key] ||
    GENSHIN_ICONS[logo.name.toUpperCase()] ||
    Object.values(GENSHIN_ICONS).find((item) =>
      key.includes(item.label.replace(/\s+/g, ""))
    );

  if (found) {
    return (
      <div
        className={cn(
          "flex h-14 min-w-[170px] items-center gap-3 rounded-xl border border-white/10 bg-card/60 px-4 py-2",
          "backdrop-blur-md transition-all duration-300",
          "hover:scale-105 hover:border-white/25 hover:bg-card/90 hover:shadow-xl"
        )}
        style={{
          boxShadow: "0 4px 16px -2px rgba(0,0,0,0.4)",
        }}
        aria-label={found.label}
        role="img"
      >
        <div className="flex items-center justify-center shrink-0">
          <Image
            src={found.imageSrc}
            alt={found.label}
            width={32}
            height={32}
            className="size-8 object-contain transition-transform duration-300 hover:scale-110 drop-shadow-md"
          />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold tracking-wider text-foreground/90 font-mono">
            {found.label}
          </span>
          {found.element && (
            <span
              className="text-[10px] font-semibold tracking-wide opacity-90"
              style={{ color: found.color }}
            >
              {found.element}
            </span>
          )}
        </div>
      </div>
    );
  }

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
