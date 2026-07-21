"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface GenshinBackgroundProps {
  className?: string;
}

/**
 * Ảnh nền Genshin Impact thông minh hỗ trợ hiệu ứng thị sai (Parallax),
 * Phóng to nhẹ (Zoom), Độ mờ tiêu cự (Depth-of-field) và Tự tăng lớp phủ tương phản
 * khi người dùng cuộn chuột xuống.
 */
export function GenshinBackground({ className }: GenshinBackgroundProps) {
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();

  // Hiệu ứng thị sai & phóng to cho ảnh nền
  const bgScale = useTransform(scrollY, [0, 1000], prefersReducedMotion ? [1, 1] : [1, 1.12]);
  const bgY = useTransform(scrollY, [0, 1000], prefersReducedMotion ? [0, 0] : [0, 70]);
  const blurVal = useTransform(scrollY, [0, 800], prefersReducedMotion ? [0, 0] : [0, 4]);
  const filterString = useTransform(blurVal, (v) => `blur(${v}px)`);

  // Hiệu ứng tăng dần lớp phủ & độ mờ backdrop khi cuộn để bảo vệ độ đọc của chữ
  const overlayOpacity = useTransform(scrollY, [0, 800], [0.65, 0.85]);
  const overlayBlurVal = useTransform(scrollY, [0, 800], prefersReducedMotion ? [2, 2] : [2, 6]);
  const backdropFilterString = useTransform(overlayBlurVal, (v) => `blur(${v}px)`);

  return (
    <>
      {/* Layer 1: Ảnh landscape — Hỗ trợ parallax zoom & blur */}
      <motion.div
        className={cn(
          "pointer-events-none fixed inset-0 -z-30 overflow-hidden",
          className
        )}
        aria-hidden
        style={{
          scale: bgScale,
          y: bgY,
          filter: filterString,
        }}
      >
        <Image
          src="/bg/teyvat-landscape.png"
          alt="Genshin Impact Landscape"
          fill
          priority
          className="object-cover"
          sizes="100vw"
          quality={85}
        />
      </motion.div>

      {/* Layer 2: Overlay tương thích Light / Dark mode — dùng token --background để hòa trộn chuẩn */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-20 bg-background"
        style={{
          opacity: overlayOpacity,
          backdropFilter: backdropFilterString,
          WebkitBackdropFilter: backdropFilterString,
        }}
      />

      {/* Layer 3: Gradient fade phía dưới — footer hòa trộn mượt mạ */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-[var(--background)] to-transparent"
      />
    </>
  );
}

export default GenshinBackground;