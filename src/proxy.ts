import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Proxy (Next.js 16 — tên mới của "middleware"):
 *  1. Gate các khu vực cần auth: /admin, /booster, /dashboard, /order/create
 *  2. Inject CSP nonce cho mọi HTML response
 *
 * Edge-friendly: KHÔNG dùng Prisma. Chỉ verify JWT (jose).
 * Logic business (load user, kiểm tra isActive) vẫn chạy ở server-component layout.
 */

const PUBLIC_AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function buildCspHeader(nonce: string): string {
  const isProd = process.env.NODE_ENV === "production";
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "https://*.payos.vn",
      "https://us.i.posthog.com",
      "https://eu.i.posthog.com",
    ],
    "style-src": [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
    ],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https://*.supabase.co",
      "https://api.vietqr.io",
      "https://img.vietqr.io",
      "https://*.vietqr.io",
      "https://api.qrserver.com",
      "https://*.payos.vn",
    ],
    "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
    "connect-src": [
      "'self'",
      "https://*.supabase.co",
      "wss://*.supabase.co",
      "https://*.payos.vn",
      "https://us.i.posthog.com",
      "https://eu.i.posthog.com",
      "https://*.sentry.io",
    ],
    "frame-src": [
      "'self'",
      "https://*.payos.vn",
      "https://hooks.stripe.com",
      "https://challenges.cloudflare.com",
    ],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    "form-action": ["'self'"],
    "manifest-src": ["'self'"],
  };

  const base = Object.entries(directives)
    .map(([k, v]) => `${k} ${v.join(" ")}`)
    .join("; ");

  // Chỉ ở prod mới thêm report-uri (Report-Only); dev bỏ để tránh spam log
  return isProd ? `${base}; report-uri /api/csp-report` : base;
}

async function readToken(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const secret = process.env.NEXTAUTH_SECRET;
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    return payload as {
      userId: string;
      email: string;
      role: "CUSTOMER" | "BOOSTER" | "ADMIN";
    };
  } catch {
    return null;
  }
}

function homeForRole(role: string | undefined): string {
  if (role === "ADMIN") return "/admin";
  if (role === "BOOSTER") return "/booster";
  return "/";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ----- 1) Auth gate -----

  // /admin/* — yêu cầu ADMIN (trừ /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const user = await readToken(request);
    if (!user || user.role !== "ADMIN") {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // /booster/* — yêu cầu BOOSTER hoặc ADMIN
  if (pathname.startsWith("/booster")) {
    const user = await readToken(request);
    if (!user || (user.role !== "BOOSTER" && user.role !== "ADMIN")) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // /dashboard/*, /order/create — yêu cầu login
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/order/create")
  ) {
    const user = await readToken(request);
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Admin/Booster truy cập /dashboard → đẩy về khu vực của họ
    if (pathname.startsWith("/dashboard")) {
      if (user.role === "ADMIN")
        return NextResponse.redirect(new URL("/admin", request.url));
      if (user.role === "BOOSTER")
        return NextResponse.redirect(new URL("/booster", request.url));
    }
  }

  // Nếu đã login mà vào trang auth → redirect về home của role
  const isAuthPage =
    PUBLIC_AUTH_ROUTES.some(
      (r) => pathname === r || pathname.startsWith(`${r}/`),
    ) || pathname === "/admin/login";

  if (isAuthPage) {
    const user = await readToken(request);
    if (user) {
      return NextResponse.redirect(
        new URL(homeForRole(user.role), request.url),
      );
    }
  }

  // ----- 2) CSP nonce cho HTML responses -----
  const isHtml =
    request.method === "GET" &&
    !pathname.startsWith("/_next/") &&
    !pathname.startsWith("/api/") &&
    !pathname.includes(".");

  if (isHtml) {
    const nonce = generateNonce();
    const cspHeader = buildCspHeader(nonce);

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set("Content-Security-Policy", cspHeader);
    response.headers.set("x-nonce", nonce);
    return response;
  }

  // ----- 3) Static / API — header phụ -----
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin",
  );
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.svg|robots.txt|sitemap.xml|api/webhooks|.*\\..*).*)",
  ],
};
