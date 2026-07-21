# GenshinFlow — Báo cáo Review Toàn diện & Nâng cấp UI/UX Client

> Ngày review: 2026-07-09 · Phương pháp: chạy local thật (Docker Postgres + migrate + seed + build) + đọc mã theo lớp
> Rubric: OWASP Top 10 · WCAG 2.1 AA · Core Web Vitals · checklist trong `tailieu*.md` / `skill.md`
> Phạm vi: TOÀN DIỆN — UI/UX + bảo mật + backend/DB + hiệu năng + đối chiếu 6 phase (A→F)

---

## 1. Tóm tắt điều hành (Executive Summary)

> ✅ **Cập nhật 2026-07-09:** Đã sửa **4/4 P0** + **4/6 P1** (double-spend, re-auth reveal, security headers, CSRF/Origin) + nhiều **P2** (IDOR deposit/status, Zod validation auth, middleware→proxy Next 16, gỡ `next-auth`, IP capture, balance `aggregate`, **dọn lint → 0 errors** từ 44) + **persist chat đơn hàng** (P1-6 phần chat: API `/api/orders/[id]/messages` GET/POST + wire khách & admin) + test hồi quy (Vitest — **30/30 pass**, `npm run build` PASS, `npm run lint` **0 errors / 0 warnings** (từ 44/41)). Còn phụ thuộc hạ tầng: P1-3 (rate-limit Redis), P1-6 (upload ảnh). Chi tiết ở `REMEDIATION-BACKLOG.md`. Phần mô tả bên dưới giữ nguyên **hiện trạng tại thời điểm review** để tham chiếu bối cảnh.

GenshinFlow là một **MVP chức năng cao chạy tốt trên localhost**. Phần giao diện khách hàng (client) đã ở mức **đẹp – chuyên nghiệp**, nền tảng design system tốt (OKLCH brand palette, animation, dark mode, loading/empty state, toast). Backend đã hiện thực gần đủ Giai đoạn A–D: xác thực JWT + bcrypt, ví sổ cái (ledger), tạo đơn trong transaction, mã hóa AES-256-GCM cho mật khẩu game, reveal có audit log + tự ẩn 20s + auto-delete credential.

**Tuy nhiên chưa đạt ngưỡng production** do một số lỗi tài chính/bảo mật nghiêm trọng và thiếu hoàn toàn kiểm thử tự động:

- 🔴 **P0 — Double refund**: hủy/hoàn đơn cộng tiền cho khách **2 lần** (`updateOrderStatusAdmin`).
- 🔴 **P0 — Webhook PayOS**: idempotency bị vô hiệu (fallback `Date.now()`) + **không verify `amount`** → rủi ro cộng tiền sai/trùng.
- 🔴 **P0 — Secret**: `.env` chứa secret trong repo + fallback hardcode + KDF yếu + `NEXTAUTH_SECRET` < 32 ký tự.
- 🟠 **P1**: double-spend race khi tạo đơn đồng thời; chưa 2FA/re-auth khi xem mật khẩu; rate limit in-memory; thiếu security headers/CSP.
- ⚪ **P2**: nhiều mảng còn mock (forgot-password, notifications, chat đơn, upload ảnh); IDOR ở `deposit/status`; 44 lỗi lint (`no-explicit-any`); `middleware.ts` deprecated (Next 16 → `proxy.ts`).

**Kết luận mức độ:** khoảng **65–70%** so với mục tiêu "localhost hoàn chỉnh"; **~40%** so với "production-ready". Đã xong A–D ở mức chức năng, **E (test) = 0%**, **F (production) ≈ 5%**.

---

## 2. Ma trận hoàn thành 6 Giai đoạn (A→F)

| Giai đoạn | Ước lượng | Bằng chứng | Khoảng trống chính |
|---|---|---|---|
| **A. UI tĩnh** | **~98%** | Đủ trang marketing/auth/dashboard/admin; design system tốt; build 49 route pass | Còn mock: notifications, testimonials, faq, chat, upload ảnh |
| **B. Backend lõi** | **~85%** | JWT+bcrypt, Prisma schema+migration+seed, ví ledger, tạo đơn transaction, HOLD→CHARGE, refund | **Double-refund bug**, double-spend race, forgot-password chưa có |
| **C. PayOS** | **~70%** | `deposit/create` gọi SDK, `status` polling, webhook verify chữ ký + idempotency + transaction | **Bug idempotency**, **không verify amount**, matching mong manh; keys placeholder → chưa E2E |
| **D. Bảo mật account game** | **~75%** | AES-256-GCM, reveal + audit log + viewCount + expiresAt, **auto-delete credential khi hoàn tất/hủy** | Chưa re-auth/2FA trước reveal; KDF yếu (slice/pad); fallback secret |
| **E. Kiểm thử bảo mật** | **~10%** *(đã khởi động)* | Vitest + 16 test hồi quy cho P0 (encryption round-trip/tamper/fail-fast, computeBalance cancel-neutral, webhook idempotency + verify amount) | Cần bổ sung test authz/API + E2E (Playwright) + CI |
| **F. Production** | **~5%** | secure cookie ở prod | Chưa 2FA, secret trong repo, thiếu headers/CSP, `middleware`→`proxy`, chưa monitoring/backup |

**Mức tổng thể: “MVP chức năng cao ở localhost”.** Sẵn sàng demo, **chưa sẵn sàng nhận tiền/đơn thật**.

---

## 3. Nâng cấp UI/UX CLIENT đã thực hiện (Before → After)

Phần client vốn đã tốt; các thay đổi tập trung vá lỗi thật + polish + bổ sung primitive còn thiếu, **không viết lại**.

| # | File | Before | After |
|---|---|---|---|
| 1 | `components/shared/theme-toggle.tsx` | `setState` đồng bộ trong `useEffect` → lỗi lint React 19 `react-hooks/set-state-in-effect` | Giữ pattern mount an toàn hydration + chú thích + disable rule đúng chỗ (hết lỗi) |
| 2 | `components/shared/navbar.tsx` | Import thừa `AnimatePresence`, `X` | Gỡ import thừa (sạch warning) |
| 3 | `app/(customer)/dashboard/orders/page.tsx` | `<AnimatePresence>` bọc `TableRow` thường (no-op) + import `motion` thừa + biến `index` thừa | Gỡ dead code, đơn giản hoá map |
| 4 | `components/shared/empty-state.tsx` | (chưa có primitive empty state dùng chung) | **MỚI**: `EmptyState` tái dùng (icon gradient + title + desc + action, có `role="status"`) |
| 5 | `components/shared/count-up.tsx` + landing `StatsSection` | Section gắn mác "counter" nhưng giá trị **tĩnh** | **MỚI**: `CountUp` đếm số động khi cuộn vào tầm nhìn, tôn trọng `prefers-reduced-motion`; wire vào stats + thêm khung divider cho ấn tượng |
| 6 | `app/(customer)/order/create/page.tsx` | Trang đứng độc lập **không có navbar** nhưng dùng `pt-24` → khoảng trống trên đầu, không có lối điều hướng | Thêm **mini-header** (logo + link “Về Dashboard”), giảm padding — luồng checkout gọn gàng, có lối thoát |

**Verify:** `npm run build` PASS (exit 0) sau toàn bộ thay đổi; 49 route biên dịch, không lỗi hydration mới.

### Đánh giá chất lượng UI/UX client (đã tốt sẵn)
- **Landing**: hero (particles + gradient orbs), features hover-lift, quy trình 4 bước có connecting-line, stats (giờ đã động), testimonials, FAQ accordion, CTA. Ấn tượng.
- **Auth**: split-layout branding + form, toast, loading spinner, show/hide password, checkbox điều khoản bắt buộc. Chuyên nghiệp.
- **Dashboard khách**: sidebar thu gọn + mobile Sheet, card số dư gradient, bảng đơn có filter/search/empty-state, timeline, ví. Sạch.
- **Order wizard**: 4 bước, validate từng bước, callout cảnh báo bảo mật (AES-256-GCM), summary xác nhận. Rất tốt.
- **Deposit**: mệnh giá nhanh, QR + polling 3s, nút copy nội dung/số tiền, animation "đang chờ". Tốt.

---

## 4. Findings theo lớp

### 4.1 UI/UX Client (P2 trừ khi ghi khác)
- **Mock cần gỡ khi lên thật**: `forgot-password` (dùng `setTimeout` giả), `dashboard/notifications` (state client, không API), chat trong chi tiết đơn (khách + admin đều **không lưu DB**), upload ảnh kết quả (chỉ UI dropzone). → cần backend, **xác nhận trước khi làm** (đụng schema/API).
- **A11y**: form có `<Label htmlFor>` ✓, focus-ring util ✓, EmptyState có `role="status"` ✓. Cần rà thêm: contrast text trên nền gradient hero (blue-100/60 trên gradient — nên kiểm ≥ 4.5:1), `aria-label` cho nút icon-only (copy/eye), trap focus ở Dialog reveal.
- **Mật độ (density)**: `Input`/`Button` mặc định `h-8` (base-nova, phong cách Linear) — hơi nhỏ cho CTA chính/mobile touch target (WCAG 2.5.5 khuyến nghị ~44px). Cân nhắc size lớn hơn cho nút submit chính.
- **StatsSection**: số "500+", "4.9/5"… là số marketing hardcode (chấp nhận được cho landing).

### 4.2 Backend / API & Toàn vẹn dữ liệu
- 🔴 **P0 — Double refund** — `src/modules/orders/admin-actions.ts` (`updateOrderStatusAdmin`, nhánh cancel/refund): vừa set giao dịch `hold` → `status:"failed"` (loại khỏi tổng số dư → +amount) **vừa** tạo giao dịch `refund` (+amount). Do số dư = `Σ amount(status="success")` (xác nhận ở `api/auth/me` và `orders/actions.ts`), khách được **cộng gấp đôi** số tiền đơn. Sửa: chọn MỘT cách — hoặc void hold, hoặc tạo bút toán refund đối ứng (giữ hold), không làm cả hai.
- 🟠 **P1 — Double-spend race** — `orders/actions.ts`: số dư đọc bằng `reduce()` rồi mới tạo `hold`, trong `$transaction` nhưng **không khóa dòng** (SELECT … FOR UPDATE / isolation `Serializable`). Hai request đồng thời có thể cùng đọc số dư đủ và cùng trừ → âm ví. Sửa: nâng isolation lên `Serializable` hoặc khóa hàng user/ledger.
- ⚪ **P2 — Cột `balance` snapshot không nhất quán**: `webhook` và `admin-actions` tính snapshot qua `lastTx.balance`; `createOrder`/`me` tính bằng `reduce`. Số dư thật luôn được suy lại bằng `reduce` (an toàn cho chi tiêu), nhưng cột `balance` lưu trong `WalletTransaction` có thể lệch → gây nhầm lẫn khi tra soát. Sửa: tính snapshot thống nhất trong cùng transaction.
- ⚪ **P2 — IDOR** — `api/deposit/status/[id]`: `findUnique({ where: { id } })` **không kiểm tra chủ sở hữu** → user đã đăng nhập bất kỳ có thể xem `status`+`amount` của intent người khác nếu biết id. Sửa: thêm điều kiện `userId = payload.userId`.
- ⚪ **P2 — Validate đăng ký** — `api/auth/register`: chỉ kiểm tra rỗng + độ dài mật khẩu ≥ 8; **không validate định dạng email**/độ dài tên bằng Zod. Nên dùng Zod cho mọi input.
- ✅ **Authz tốt**: các API (`orders`, `orders/[id]`, `admin/*`, server actions) đều verify token + role; khách chỉ thấy đơn của mình; `orders/[id]` await `params` đúng chuẩn Next 16.

### 4.3 Bảo mật (OWASP + Section 8)
| Mục checklist | Trạng thái | Ghi chú |
|---|---|---|
| Hash mật khẩu web (bcrypt) | ✅ | `bcrypt` salt 10, `register`/`login` |
| Mã hóa AES-256-GCM mật khẩu game | ✅ | `encryption.ts` iv:tag:ciphertext |
| ENCRYPTION_KEY không commit | 🔴 | **`.env` nằm trong repo**; có fallback hardcode; KDF `slice(0,32).padEnd` (không phải scrypt/PBKDF2) |
| Admin re-auth/2FA khi xem mật khẩu | 🟠 | Có dialog xác nhận + audit log + tự ẩn 20s, **thiếu re-auth/2FA** |
| Audit log hành động nhạy cảm | ✅/🟠 | Reveal + adjust ví có log; `adjustWalletBalance` **hardcode IP `127.0.0.1`** |
| Auto vô hiệu/xóa credential | ✅ | `updateOrderStatusAdmin` xóa `orderCredential` khi completed/cancelled/refunded |
| Cookie HttpOnly/Secure/SameSite | ✅ | httpOnly + secure(prod) + sameSite=lax |
| CSRF protection | 🟠 | Chỉ dựa `sameSite=lax`; chưa có token CSRF cho API POST |
| Rate limiting | 🟠 | Có (`login` 5/1p, `register` 3/5p, `deposit` 5/10p) nhưng **in-memory** (mất khi nhiều instance/redeploy) |
| Chống SQLi | ✅ | Prisma ORM, không raw SQL |
| Chống XSS (output encoding) | ✅ | **Không có `dangerouslySetInnerHTML`** trong repo; React tự escape |
| Webhook verify chữ ký + idempotency | 🔴 | Verify chữ ký ✅ nhưng **idempotency hỏng** + không verify amount (xem 4.4) |
| Security headers / CSP | 🟠 | `next.config.ts` **trống** — thiếu CSP/HSTS/X-Frame-Options |
| 2FA Admin panel | 🔴 | Chưa có |

### 4.4 Thanh toán PayOS (Phase C)
- 🔴 **P0 — Idempotency vô hiệu** — `api/webhooks/payos`: `const webhookId = reference || `${orderCode}-${amount}-${Date.now()}``. Khi `reference` thiếu, `Date.now()` khiến mỗi webhook có id **luôn khác nhau** → check trùng `paymentWebhookEvent` không bao giờ bắt được → **cộng tiền nhiều lần** nếu PayOS retry. Sửa: khoá idempotency theo `orderCode` (đã unique/ổn định), không dùng `Date.now()`.
- 🔴 **P0/P1 — Không verify amount** — webhook cộng thẳng `amount` từ payload mà **không đối chiếu** với `PaymentIntent.amount`. Kẻ tấn công/replay có thể lệch số tiền. Sửa: so khớp `amount === paymentIntent.amount` trước khi ghi `deposit`.
- 🟠 **P1 — Matching mong manh**: tìm intent bằng `content contains String(orderCode)` (không có cột `orderCode` riêng). Nên lưu `orderCode` thành cột và match chính xác.
- ℹ️ **Không E2E được ở local**: `PAYOS_*` là placeholder → `deposit/create` gọi SDK sẽ trả **502**. Luồng QR chỉ kiểm chứng bằng đọc mã + mô phỏng. `deposit/create` khởi tạo intent + `expiresAt` 15 phút + lưu DB đúng; polling `status` mỗi 3s hoạt động.

### 4.5 Hiệu năng & tính đúng Next.js 16
- 🟠 **P1 — `next.config.ts` trống**: thiếu `images` (remotePatterns cho `api.vietqr.io`/QR ngoài), `headers()` bảo mật. Ở Next 16 `images.qualities` mặc định `[75]`, `minimumCacheTTL` 4h.
- ⚪ **P2 — `middleware.ts` deprecated**: Next 16 đổi `middleware` → **`proxy.ts`** (build log hiển thị "Proxy (Middleware)"). Vẫn chạy nhưng nên migrate (có codemod).
- ⚪ **P2 — Balance O(n)**: `me`/`createOrder` load toàn bộ giao dịch rồi `reduce`. Với user nhiều giao dịch sẽ chậm. Nên dùng `aggregate({ _sum })` hoặc bảng tổng hợp.
- ⚪ **P2 — Dashboard client-side waterfall**: các trang dashboard là `"use client"`, `layout` gọi `/api/auth/me` và `page` lại gọi `/api/auth/me` + orders + txs trong `useEffect` → **gọi `/me` trùng** + waterfall. Cân nhắc chuyển sang Server Component fetch trực tiếp DB (giảm round-trip, bảo mật hơn).
- ⚪ **P2 — Lint**: 44 errors (`@typescript-eslint/no-explicit-any` ở nhiều `catch (error: any)` + API) + 41 warnings (unused vars). Không chặn build (Next 16 `next build` không chạy lint) nhưng nợ chất lượng.
- ✅ Build Turbopack 30.6s, TypeScript sạch; async `cookies()`/`params` đã dùng đúng chuẩn Next 16.

---

## 5. Cách đã kiểm chứng (Verification)
- **Môi trường**: Node v22.18, Docker; `prisma migrate deploy` tạo `genshinflow_db` + áp migration `20260708171116_init` THÀNH CÔNG; `tsx prisma/seed.ts` THÀNH CÔNG (admin + 2 khách + dịch vụ + đơn mẫu).
- **Build**: `npm run build` PASS (exit 0), 49 route, TypeScript 30.6s — cả trước và sau khi sửa UI.
- **Lint**: `npm run lint` = 44 errors + 41 warnings (baseline).
- **Đọc mã theo lớp**: schema, middleware, lib (jwt/encryption/rate-limit/payos/db), toàn bộ luồng client (landing/auth/dashboard/order/deposit), admin (layout + order detail + reveal), API (auth/orders/deposit/webhook), server actions (orders + wallet).
- **Giới hạn**: PayOS không có key thật → luồng nạp tiền không chạy E2E; test tương tác runtime giới hạn ở static generation của build (chưa crawl bằng trình duyệt thật).

---

## 6. Tài khoản test (seed)
- Admin: `admin@genshinflow.vn` / `admin123`
- Khách: `an.nguyen@gmail.com` / `user123` (số dư ~520k + đơn ord-1 in_progress, ord-2 completed) · `binh.tran@gmail.com` / `user123`

---

## 7. Kết luận & bước tiếp theo
Client UI/UX đã đạt yêu cầu "đẹp – chuyên nghiệp – ấn tượng" và đã được vá + polish thêm. Rào cản lên production **không phải giao diện** mà là: (1) lỗi tài chính P0 (double-refund, webhook), (2) secret/2FA, (3) thiếu test. Xem `REMEDIATION-BACKLOG.md` cho danh sách khắc phục ưu tiên P0/P1/P2 + lộ trình hoàn thiện Phase E (test) & F (production).



---

## 8. Cập nhật UX (2026-07-10) — Gộp khu KHÁCH vào website

Theo yêu cầu người dùng, khu khách hàng đã được gộp liền mạch vào chung khung website (bỏ giao diện sidebar riêng):
- **Navbar** (`components/shared/navbar.tsx`): fetch `/api/auth/me`, hiển thị **menu người dùng** (tên + số dư + link tài khoản: Tổng quan/Đơn hàng/Nạp tiền/Ví/Hồ sơ/Thông báo + Đăng xuất) khi đăng nhập khách; nút **"Trang quản trị"** khi là admin; giữ **Đăng nhập/Đăng ký** khi chưa đăng nhập. Có cả menu mobile.
- **`(customer)/dashboard/layout.tsx`**: thay layout sidebar bằng **Navbar + Footer + container** (cùng khung website). URL `/dashboard/*` giữ nguyên.
- Sau **đăng nhập/đăng ký khách → về trang chủ `/`** (login/register page + `proxy.ts` cập nhật).
- **Admin panel giữ nguyên** dạng bảng quản trị sidebar riêng (theo yêu cầu 2a).

Verify: `npm run build` PASS · `npm run lint` 0/0 · `npm test` 30/30 · runtime `/dashboard` HTTP 200 (đã render kèm Footer = khung website mới, không còn sidebar).
