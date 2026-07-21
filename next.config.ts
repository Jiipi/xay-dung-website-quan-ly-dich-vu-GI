import type { NextConfig } from "next";

/**
 * Genshin77 — Next.js config
 *
 * - Middleware (`src/middleware.ts`) chịu trách nhiệm inject CSP nonce + auth gate.
 * - File này chỉ giữ default headers, image config, powered-by off.
 * - KHÔNG set CSP ở đây để tránh xung đột với nonce-based CSP từ middleware.
 */

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {},
  typedRoutes: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.vietqr.io" },
      { protocol: "https", hostname: "img.vietqr.io" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.supabase.in" },
    ],
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85],
  },
};

export default nextConfig;
