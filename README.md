# Genshin77 — Dịch vụ Genshin Impact Chuyên Nghiệp

Nền tảng thương mại dịch vụ game Genshin Impact: đặt đơn, thanh toán (PayOS),
nhận Booster, đánh giá, hỗ trợ khách hàng.

> Stack: **Next.js 16.2** (App Router + Turbopack + `proxy.ts` thay cho `middleware.ts`),
> React 19.2, Prisma 7.8 + PostgreSQL (Supabase), Tailwind v4 + shadcn/ui,
> JWT (jose), PayOS, Resend, Sentry, PostHog.

---

## Prerequisites

- **Node.js >= 20.0.0** (đã khoá trong `package.json` → `engines`)
- **PostgreSQL** (khuyến nghị Supabase, transaction pooler ở port **6543** cho runtime)
- Tài khoản: PayOS, Resend, Sentry, PostHog (các biến trong `.env.example`)

---

## Quick start

```bash
# 1. Cài deps
npm install

# 2. Cấu hình env
cp .env.example .env
# Sau đó chỉnh các giá trị THẬT (xem bảng dưới)
# BẮT BUỘC đổi: NEXTAUTH_SECRET, ENCRYPTION_KEY, PAYOS_*

# 3. Migrate + seed
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 4. Dev
npm run dev
# → http://localhost:3000
```

---

## Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Chạy production server (sau khi build) |
| `npm run lint` | ESLint toàn project |
| `npm run typecheck` | TypeScript check (không emit) |
| `npm run test` | Vitest unit tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Tạo + apply migration (dev) |
| `npm run prisma:deploy` | Apply migration (production) |
| `npm run prisma:studio` | Mở Prisma Studio |
| `npm run prisma:seed` | Chạy seed data |

---

## Environment variables

Copy `.env.example` → `.env` rồi điền giá trị thật.

| Nhóm | Biến | Mô tả |
|---|---|---|
| **Database** | `DATABASE_URL` | Supabase transaction pooler (port **6543**) |
| | `DIRECT_URL` | Direct connection (port 5432, dùng cho migrate) |
| **Auth** | `NEXTAUTH_SECRET` | JWT secret, ≥32 ký tự (sinh: `openssl rand -hex 32`) |
| | `NEXTAUTH_URL` | URL public (vd `https://genshin77.vn`) |
| **Mã hoá** | `ENCRYPTION_KEY` | AES-256-GCM, đúng 32 ký tự (dùng cho OrderCredential) |
| **PayOS** | `PAYOS_CLIENT_ID` / `PAYOS_API_KEY` / `PAYOS_CHECKSUM_KEY` | Lấy từ my.payos.vn |
| | `PAYOS_WEBHOOK_URL` | **HTTPS public** khi deploy production |
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public |
| | `SUPABASE_SERVICE_ROLE_KEY` | **Private**, admin, không lộ client |
| | `SUPABASE_STORAGE_BUCKET` | Bucket mặc định |
| **Email** | `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `RESEND_FROM_NAME` | Đăng ký tại resend.com |
| **Analytics** | `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | PostHog cloud hoặc self-host |
| **Rate limit** | `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis — multi-instance |
| **Observability** | `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | Sentry error tracking |
| **App** | `NEXT_PUBLIC_APP_URL` | OG image, sitemap, return URL |
| | `NEXT_PUBLIC_MAX_UPLOAD_MB` | Upload giới hạn (mặc định 10) |
| **Optional** | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth (Sprint 6) |
| | `ZALO_OA_ACCESS_TOKEN` | Zalo OA notifications |

> ⚠️ PayOS webhook PHẢI đổi sang HTTPS domain thật khi deploy production.
> Khai báo trong my.payos.vn → Kênh thanh toán → Webhook URL.

---

## Cấu trúc thư mục

```
src/
  app/                          # App Router
    (marketing)/                # Public (landing, pricing, blog, ...)
    (auth)/                     # /login, /register, ...
    (customer)/                 # /dashboard, /order
      dashboard/
      order/
    (booster)/booster/          # /booster
    (admin)/admin/              # /admin (Admin-only)
    api/                        # Route handlers
      webhooks/{payment,payos}  # Webhook receivers
      csp-report/               # CSP violation endpoint
    proxy.ts                    # Next.js 16 proxy (auth + CSP nonce)
    error.tsx / loading.tsx     # Root fallback UI
    global-error.tsx            # Crash trong root layout
  components/                   # Shared UI (shadcn, animations, marketing)
  modules/                      # Business layer (3-tier)
    orders/                     # orders/actions.ts, admin-actions.ts
    wallet/                     # balance, ledger
    reviews/  conversations/  notifications/ ...
    _shared/                    # session, errors
  lib/                          # Infrastructure
    db.ts                       # Prisma client
    jwt.ts                      # JWT sign/verify
    auth.ts                     # Server-side session
    api-handler.ts              # API helpers
    encryption.ts               # AES-256-GCM
    payos.ts / payos-webhook.ts # Payment integration
    logger.ts                   # Centralized logger (PII redaction)
    email.ts                    # Resend
    rate-limit.ts               # Upstash / in-memory fallback
    csrf.ts                     # CSRF guard
    totp-2fa.ts                 # TOTP 2FA
prisma/
  schema.prisma                 # 23 models, multi-tenant ready
  migrations/                   # 2 migrations
  seed.ts
proxy.ts                        # Placeholder — proxy.ts ở src/ mới được Next nhận
```

---

## Routing (App Router)

| Route | Audience | Layout |
|---|---|---|
| `/`, `/services`, `/blog`, `/pricing`, `/contact`, `/faq`, `/about` | Public | `(marketing)` |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Public | `(auth)` |
| `/dashboard/*`, `/order/create` | CUSTOMER (login required) | `(customer)` |
| `/booster/*` | BOOSTER + ADMIN | `(booster)` |
| `/admin/*` (incl. `/admin/login`) | ADMIN only | `(admin)` |
| `/api/*` | Internal | Route handlers |

**Auth gate**: chạy trong `src/proxy.ts` (Next.js 16 convention).

---

## Testing

Vitest ở `src/**/*.test.ts`. Chạy `npm run test`.

Hiện có:
- `src/lib/csrf.test.ts`
- `src/lib/encryption.test.ts`
- `src/lib/payos-webhook.test.ts`
- `src/lib/validation.test.ts`
- `src/modules/wallet/ledger.test.ts`

E2E chưa có (Playwright khuyến nghị cho sprint sau).

---

## Production deployment

Xem chi tiết trong [docs/SPRINT0_PRODUCTION_GATE.md](./docs/SPRINT0_PRODUCTION_GATE.md).

Tóm tắt checklist:

- [ ] Rotate secrets (`NEXTAUTH_SECRET`, `ENCRYPTION_KEY`, `PAYOS_*`)
- [ ] Set `DATABASE_URL` → Supabase transaction pooler (port **6543**)
- [ ] Set `PAYOS_WEBHOOK_URL` → HTTPS production domain
- [ ] Configure Sentry (DSN, auth token, source maps upload)
- [ ] Configure PostHog (analytics)
- [ ] Configure Upstash Redis cho rate-limit
- [ ] Verify CSP header được inject (xem DevTools → Network → Response Headers)
- [ ] Verify 401 redirect cho `/admin/*` không cookie
- [ ] Verify `/api/csp-report` không trả 404
- [ ] Run `npm run lint && npm run typecheck && npm run test && npm run build`

---

## Tham khảo nội bộ

- `.agents/skills/freelancehub-architecture/` — 3-tier architecture rules
- `.agents/skills/freelancehub-db-schema/` — Prisma multi-tenant rules
- `.agents/skills/freelancehub-design-system/` — UI design tokens
- `docs/` — Internal documentation

---

## License

Proprietary © Genshin77. All rights reserved.
