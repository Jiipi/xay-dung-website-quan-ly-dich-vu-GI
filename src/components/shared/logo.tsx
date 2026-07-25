import React from "react";
import Link from "next/link";
import { Flame } from "lucide-react";
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
    <Flame className={cn("text-amber-500 shrink-0", className)} {...(props as any)} />
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
    <div className={cn("inline-flex items-center gap-2 group select-none", className)}>
      <div className="relative flex items-center justify-center">
        <Flame className={cn("text-amber-500 transition-transform duration-300 group-hover:scale-110", iconClassName)} />
        <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
      {showText && (
        <span className={cn("text-xl font-bold tracking-tight", textClassName)}>
          Genshin<span className="text-amber-500">77</span>
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
