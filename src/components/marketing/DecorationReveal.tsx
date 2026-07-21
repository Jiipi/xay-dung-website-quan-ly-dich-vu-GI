"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotion } from "@/lib/motion";

/**
 * Hiệu ứng "lật trang":
 * - Vào trang  : decorations hiện rõ (MeshGradient / Floating Shapes / Gradient)
 * - Cuộn xuống: decorations BỊ LẬT ngược (rotateX 180°) + bay ra sau (translateZ) + mờ dần
 * - Kết quả    : Ảnh Genshin landscape cố định bên dưới lộ rõ hoàn toàn
 *
 * z-index: -10 → decorations nằm TRÊN overlay tối (z:-30) nhưng DƯỚI content (z:0)
 */
export function DecorationReveal() {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();

  // Scroll 0→300px: flip từ 0° → 180° (lật ngược)
  const flip = useTransform(scrollY, [0, 300], reduced ? [0, 0] : [0, 180]);
  // opacity: 1 → 0 khi đã flip xong
  const opacity = useTransform(scrollY, [0, 150, 300], reduced ? [1, 1, 1] : [1, 0.7, 0]);
  // Scale nhỏ lại + translate ra xa
  const scale = useTransform(scrollY, [0, 300], reduced ? [1, 1] : [1, 0.85]);
  const translateZ = useTransform(scrollY, [0, 300], reduced ? [0, 0] : [0, -400]);

  if (reduced) return null;

  return (
    <>
      {/* ── Layer flip chính: mesh + shapes + gradient ── */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 origin-top"
        style={{
          rotateX: flip,
          opacity,
          scale,
          translateZ,
          // preserve-3d để rotateX thực sự hoạt động
          transformStyle: "preserve-3d",
          perspective: 1000,
        }}
      >
        {/* Gradient overlay mạnh phía trên */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[40rem] bg-gradient-to-b from-blue-500/20 via-blue-500/5 to-transparent"
        />

        {/* Mesh aurora gradient */}
        <div
          aria-hidden
          className="absolute inset-0 overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 20%, rgba(59,130,246,0.4) 0%, transparent 60%)," +
              "radial-gradient(ellipse 60% 50% at 80% 40%, rgba(168,85,247,0.3) 0%, transparent 60%)," +
              "radial-gradient(ellipse 70% 40% at 50% 80%, rgba(245,158,11,0.2) 0%, transparent 60%)",
          }}
        />

        {/* Floating orbs */}
        <FloatingShapesInline />

        {/* Noise texture */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
            backgroundSize: "256px 256px",
          }}
        />
      </motion.div>

      {/* ── Top radial glow đặc biệt cho hero section ── */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 right-0 top-0 -z-10 h-[50rem]"
        style={{ opacity, scale }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 10%, rgba(59,130,246,0.45) 0%, transparent 65%)," +
              "radial-gradient(ellipse 40% 30% at 30% 20%, rgba(168,85,247,0.2) 0%, transparent 60%)",
          }}
        />
      </motion.div>
    </>
  );
}

/* ─── Floating shapes ─── */
function FloatingShapesInline() {
  return (
    <div className="relative size-full overflow-hidden">
      {[
        { top: "12%", left: "8%", size: 320, color: "bg-blue-500/20", delay: "0s" },
        { top: "35%", right: "12%", size: 220, color: "bg-purple-500/20", delay: "0.7s" },
        { top: "58%", left: "3%", size: 280, color: "bg-amber-500/15", delay: "1.4s" },
        { top: "72%", right: "8%", size: 200, color: "bg-emerald-500/15", delay: "2.1s" },
      ].map((s, i) => (
        <div
          key={i}
          className={`absolute rounded-full ${s.color} animate-float blur-3xl`}
          style={{
            width: s.size,
            height: s.size,
            top: s.top,
            left: s.left,
            right: "right" in s ? (s as { right: string }).right : undefined,
            animationDelay: s.delay,
          }}
        />
      ))}
    </div>
  );
}

export default DecorationReveal;