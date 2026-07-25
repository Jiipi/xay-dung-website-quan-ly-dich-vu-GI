import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
  href?: string;
}

export function LogoIcon({ className = "h-8 w-8", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      {...props}
    >
      <defs>
        <linearGradient id="logo-g77-flame" x1="50" y1="8" x2="50" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="85%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#B91C1C" />
        </linearGradient>
        <linearGradient id="logo-g77-inner" x1="50" y1="28" x2="50" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="60%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="logo-g77-ring" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.95" />
        </linearGradient>
        <filter id="logo-g77-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#F59E0B" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Outer Diamond Crest */}
      <polygon
        points="50,4 96,50 50,96 4,50"
        fill="none"
        stroke="url(#logo-g77-ring)"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <polygon
        points="50,12 88,50 50,88 12,50"
        fill="none"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeOpacity="0.4"
        strokeLinejoin="round"
      />

      {/* Flame Body */}
      <path
        d="M50 14 C58 26, 78 40, 78 62 C78 76.5, 65.5 88, 50 88 C34.5 88, 22 76.5, 22 62 C22 40, 42 26, 50 14 Z"
        fill="url(#logo-g77-flame)"
        filter="url(#logo-g77-glow)"
      />

      {/* Inner Core */}
      <path
        d="M50 32 C55 41, 65 50, 65 65 C65 73.2, 58.2 80, 50 80 C41.8 80, 35 73.2, 35 65 C35 50, 45 41, 50 32 Z"
        fill="url(#logo-g77-inner)"
      />

      {/* Vision Star Accents */}
      <circle cx="50" cy="63" r="4.5" fill="#FFFFFF" opacity="0.95" />
      <path d="M50 20 L54 36 L46 36 Z" fill="#FFFFFF" opacity="0.9" />
    </svg>
  );
}

export function Logo({
  className,
  iconClassName = "h-8 w-8",
  textClassName,
  showText = true,
  href = "/",
}: LogoProps) {
  const content = (
    <div className={cn("inline-flex items-center gap-2.5 group select-none", className)}>
      <div className="relative flex items-center justify-center">
        <LogoIcon className={cn("transition-transform duration-300 group-hover:scale-110", iconClassName)} />
        <div className="absolute inset-0 bg-amber-500/25 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
      {showText && (
        <span className={cn("text-xl font-extrabold tracking-tight drop-shadow-sm", textClassName)}>
          Genshin<span className="bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">77</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="focus:outline-none rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
