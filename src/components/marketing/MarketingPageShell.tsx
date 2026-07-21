import type { ReactNode } from "react";

import { PageTransition } from "@/components/animations/PageTransition";
import { Reveal } from "@/components/animations/Reveal";
import { ScrollProgressBar } from "@/components/animations/ScrollProgressBar";
import { cn } from "@/lib/utils";

export interface MarketingPageShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * Khung trang marketing thống nhất:
 * - `ScrollProgressBar` ở top
 * - `PageTransition` bao ngoài children (fade-blur theo pathname)
 * - `Reveal` mặc định cho trường hợp trang chỉ có một khối
 *
 * Decorations (MeshGradient, FloatingShapes, NoiseOverlay, GenshinBackground)
 * được quản lý tập trung bởi `(marketing)/layout.tsx` thông qua
 * `DecorationReveal` (scroll-driven opacity) và `GenshinBackground` (fixed image).
 */
export function MarketingPageShell({
  children,
  className,
}: MarketingPageShellProps) {
  return (
    <>
      <ScrollProgressBar position="top" />
      <PageTransition>
        <main className={cn("relative z-[1] overflow-hidden", className)}>
          <Reveal>{children}</Reveal>
        </main>
      </PageTransition>
    </>
  );
}

export default MarketingPageShell;