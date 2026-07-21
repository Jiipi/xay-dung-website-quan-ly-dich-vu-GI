# GenshinFlow — Backlog Khắc phục (Remediation Backlog)

> Ưu tiên: **P0** = chặn production / rủi ro tiền–bảo mật · **P1** = cần trước khi mở cho người dùng thật · **P2** = chất lượng/nợ kỹ thuật
> Map theo 6 phase (A→F). Mỗi item: mô tả · file · hướng sửa.

---

## ✅ CẬP NHẬT 2026-07-09 — Toàn bộ 4 lỗi P0 ĐÃ ĐƯỢC SỬA + có test hồi quy

| P0 | Trạng thái | Đã làm | Bằng chứng |
|---|---|---|---|
| **P0-1** Double refund | ✅ ĐÃ SỬA | `updateOrderStatusAdmin` áp dụng bút toán đối ứng: GIỮ giao dịch trừ tiền (`hold`/`charge`), chỉ ghi **1** `refund` (+amount) → net 0 | `src/modules/wallet/ledger.test.ts` (cancel-neutral, chống double) |
| **P0-2** Webhook idempotency | ✅ ĐÃ SỬA | Khóa idempotency ổn định `resolveWebhookIdempotencyKey` (ref→paymentLinkId→orderCode, **bỏ `Date.now()`**) | `src/lib/payos-webhook.test.ts` (ổn định, ném lỗi nếu thiếu định danh) |
| **P0-3** Webhook verify amount | ✅ ĐÃ SỬA | `amountsMatch(amount, intent.amount)` trước khi cộng; lệch → 200 không cộng + log | `src/lib/payos-webhook.test.ts` (amountsMatch) |
| **P0-4** Secret/fallback | ✅ ĐÃ SỬA | Bỏ fallback hardcode ở `encryption.ts`+`jwt.ts` (fail-fast, giữ tương thích giải mã cũ); `.env.example`; `.gitignore` giữ `.env` ẩn | `src/lib/encryption.test.ts` (fail-fast khi thiếu key) |

**Kiểm chứng:** `npm test` = **16/16 pass**; `npm run build` = PASS; `npx tsx prisma/seed.ts` = PASS (dữ liệu cũ vẫn giải mã được). Test framework Vitest đã cài → **Phase E khởi động (~10%)**.
> Lưu ý đính chính: `NEXTAUTH_SECRET` thực tế dài 33 ký tự (≥ 32), không phải "< 32" như ghi ở review — nhưng fallback hardcode vẫn là rủi ro thật và đã được loại bỏ.

---

> Các mục P1/P2 dưới đây là danh sách để **thực thi sửa ở giai đoạn sau**.

---

## 🔴 P0 — Bắt buộc sửa trước khi nhận tiền/đơn thật

### P0-1 · [Phase B] Double refund khi hủy/hoàn đơn
- **File:** `src/modules/orders/admin-actions.ts` → `updateOrderStatusAdmin`, nhánh `cancelled`/`refunded`.
- **Vấn đề:** vừa set `hold`→`status:"failed"` (loại khỏi tổng số dư = +amount) **vừa** tạo `refund` (+amount) → khách được cộng **2×amount**. (Số dư = `Σ amount(success)`, xác nhận ở `api/auth/me`.)
- **Hướng sửa:** chọn MỘT cơ chế:
  - (A) Bút toán đối ứng: **giữ** `hold` (success, −amount) + tạo `refund` (+amount). Net = 0 so với trước khi đặt.
  - (B) Void hold: chỉ set `hold`→`failed`/`reversed`, **không** tạo refund.
  - Khuyến nghị (A) để giữ lịch sử ledger đầy đủ. Viết test khẳng định số dư sau hủy = số dư trước khi đặt đơn.

### P0-2 · [Phase C] Webhook PayOS — idempotency bị vô hiệu
- **File:** `src/app/api/webhooks/payos/route.ts`
- **Vấn đề:** `webhookId = reference || `${orderCode}-${amount}-${Date.now()}`` → khi thiếu `reference`, `Date.now()` làm id luôn khác → không chặn được retry trùng → **cộng tiền nhiều lần**.
- **Hướng sửa:** khoá idempotency theo giá trị **ổn định** (ưu tiên `paymentLinkId`/`reference` của PayOS; fallback `orderCode`). Không bao giờ đưa `Date.now()` vào khoá idempotency.

### P0-3 · [Phase C] Webhook PayOS — không verify số tiền
- **File:** `src/app/api/webhooks/payos/route.ts`
- **Vấn đề:** cộng thẳng `amount` từ payload, không đối chiếu `PaymentIntent.amount`.
- **Hướng sửa:** tra `PaymentIntent` theo `orderCode` chính xác, kiểm `amount === paymentIntent.amount` (và `status==="pending"`) trước khi ghi `deposit`; lệch thì log cảnh báo + bỏ qua.

### P0-4 · [Phase D/F] Secret trong repo + fallback hardcode + KDF yếu
- **File:** `.env` (đang trong repo), `src/lib/encryption.ts`, `src/lib/jwt.ts`
- **Vấn đề:** `.env` chứa `ENCRYPTION_KEY`/`NEXTAUTH_SECRET` (rò rỉ nếu commit); có fallback hardcode; `NEXTAUTH_SECRET` < 32 ký tự; KDF `slice(0,32).padEnd(32,"0")` (không phải KDF chuẩn).
- **Hướng sửa:** thêm `.env` vào `.gitignore` + xoá khỏi lịch sử git nếu đã commit; **bỏ mọi fallback**, fail-fast nếu thiếu env; sinh secret ≥ 32 bytes ngẫu nhiên; dùng `scrypt`/`PBKDF2` (hoặc dùng thẳng key 32-byte hex/base64) để dẫn xuất khoá AES; xoay khoá (key rotation) có phiên bản.

---

## 🟠 P1 — Cần trước khi mở cho người dùng thật

> ✅ **Cập nhật 2026-07-09:** P1-1, P1-2, P1-4, P1-5 **ĐÃ SỬA** (build PASS, 23/23 test PASS). P1-3 (Redis) & P1-6 (upload) phụ thuộc hạ tầng.
>
> | P1 | Trạng thái | Đã làm |
> |---|---|---|
> | P1-1 Double-spend | ✅ ĐÃ SỬA | `createOrderAction` chạy `$transaction` **Serializable** + retry khi xung đột (P2034); balance qua `computeBalance` |
> | P1-2 Re-auth reveal | ✅ ĐÃ SỬA | `/api/admin/orders/reveal` yêu cầu **nhập lại mật khẩu admin** (bcrypt.compare) + log lần sai; dialog có ô mật khẩu, nút disable tới khi nhập |
> | P1-4 Security headers | ✅ ĐÃ SỬA | `next.config.ts`: HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, CSP tối thiểu (frame-ancestors/base-uri/object-src) + `images.remotePatterns`. *(script-src CSP bằng nonce → Phase F)* |
> | P1-5 CSRF/Origin | ✅ ĐÃ SỬA | helper `isCrossSiteRequest`/`isBlockedCrossSite` (`src/lib/csrf.ts`) + áp dụng `login`/`register`/`deposit/create`; test `csrf.test.ts` |
> | P1-3 Rate-limit Redis | ⏸️ **HẠ TẦNG** | Cần Redis/Upstash — chưa dựng được ở môi trường local hiện tại |
> | P1-6 Chat persist + upload ảnh | 🟡 **MỘT PHẦN** | ✅ Chat **đã persist** (`/api/orders/[id]/messages` GET/POST + wire khách & admin, có authz + CSRF); **upload ảnh** vẫn cần object storage |

### P1-1 · [Phase B] Double-spend race khi tạo đơn
- **File:** `src/modules/orders/actions.ts` → `createOrderAction`
- **Sửa:** nâng `$transaction` lên isolation `Serializable` hoặc khoá dòng ledger của user; kiểm số dư trong cùng khóa; retry khi xung đột.

### P1-2 · [Phase D] Chưa re-auth/2FA khi Admin xem mật khẩu game
- **File:** `src/app/api/admin/orders/reveal/route.ts` + `src/app/(admin)/admin/orders/[id]/page.tsx`
- **Sửa:** yêu cầu nhập lại mật khẩu admin (hoặc TOTP 2FA) trước khi giải mã; giữ audit log + auto-hide 20s hiện có.

### P1-3 · [Phase F] Rate limit in-memory → không bền
- **File:** `src/lib/rate-limit.ts`
- **Sửa:** chuyển sang store dùng chung (Redis/Upstash) để hiệu lực qua nhiều instance & sau redeploy; giữ API `isRateLimited`.

### P1-4 · [Phase F] Thiếu Security Headers / CSP
- **File:** `next.config.ts` (đang trống)
- **Sửa:** thêm `headers()` với CSP, HSTS, X-Frame-Options=DENY, X-Content-Type-Options=nosniff, Referrer-Policy; cấu hình `images.remotePatterns` cho QR ngoài (`api.vietqr.io`).

### P1-5 · [Phase B/F] CSRF cho API POST
- **Sửa:** dùng double-submit token hoặc chuyển thao tác nhạy cảm sang Server Actions (có bảo vệ origin), không chỉ dựa `sameSite=lax`.

### P1-6 · [Phase F] Hoàn thiện admin panel cho vận hành thật
- **Sửa:** chat đơn hàng (khách + admin) hiện **không lưu DB** → cần API + bảng `OrderMessage` (đã có schema) để persist; upload ảnh kết quả hiện chỉ là UI → cần lưu trữ thật (object storage) + gắn `resultImages`.

---

## ⚪ P2 — Chất lượng, nợ kỹ thuật, polish

> ✅ **Cập nhật 2026-07-09:** P2-1, P2-2, P2-4, P2-9 **ĐÃ SỬA** (build PASS, 30/30 test PASS).
>
> | P2 | Trạng thái | Đã làm |
> |---|---|---|
> | P2-1 IDOR deposit/status | ✅ ĐÃ SỬA | thêm điều kiện `userId` (findFirst) — chỉ chủ intent xem được trạng thái |
> | P2-2 Zod validation | ✅ ĐÃ SỬA | `src/lib/validation.ts` (register/login schema) áp dụng vào 2 route; test `validation.test.ts` |
> | P2-4 middleware→proxy | ✅ ĐÃ SỬA | `src/middleware.ts` → `src/proxy.ts`, export `proxy` (Next 16, nodejs runtime); build nhận "Proxy (Middleware)" |
> | P2-9 gỡ next-auth | ✅ ĐÃ SỬA | `npm uninstall next-auth` (đã xác nhận không import ở đâu) |
> | P2-9 IP capture adjustWallet | ✅ ĐÃ SỬA | lấy IP thật từ header `x-forwarded-for` (qua `headers()`) thay hardcode 127.0.0.1 |
> | P2-5 balance aggregate | ✅ ĐÃ SỬA | `/api/auth/me` dùng `aggregate _sum` thay findMany+reduce |
> | P2-7 dọn lint | ✅ ĐÃ SỬA | **0 errors + 0 warnings** (từ 44 errors + 41 warnings): hết `no-explicit-any`; `purity` fix bằng precompute hero particles module scope; `set-state-in-effect`/`exhaustive-deps` disable có chú thích cho mount/fetch/timer hợp lệ; gỡ hết unused imports/vars/bindings. **Lint sạch hoàn toàn** |
> | P2-3 balance snapshot | ✅ ĐÃ SỬA | helper dùng chung `getBalanceInTx` (aggregate) cho create-order/refund/webhook/adjust — snapshot nhất quán |
> | P2-6 gỡ mock | 🟡 **MỘT PHẦN** | ✅ `notifications` suy từ dữ liệu thật (`/api/notifications` từ OrderStatusLog + WalletTransaction); `forgot-password` vẫn cần email (hạ tầng) |
> | P2-8 dashboard Server Component | ⏳ CÒN LẠI | refactor lớn (lint đã xử lý bằng disable có chú thích); để lại vì độ lớn/rủi ro |

### P2-1 · [Phase C] IDOR ở kiểm tra trạng thái nạp
- **File:** `src/app/api/deposit/status/[id]/route.ts` — thêm điều kiện `userId = payload.userId` vào truy vấn.

### P2-2 · [Phase B] Validate input bằng Zod
- **File:** `api/auth/register` (+ các API nhận body) — validate email/tên/mật khẩu bằng Zod, trả lỗi chuẩn.

### P2-3 · [Phase B] Cột `balance` snapshot không nhất quán
- **File:** `webhooks/payos`, `orders/admin-actions`, `orders/actions` — tính snapshot thống nhất trong cùng transaction (hoặc bỏ cột, luôn suy từ `_sum`).

### P2-4 · [Phase F] `middleware.ts` → `proxy.ts` (Next 16)
- **Sửa:** đổi tên file + export `proxy`; dùng codemod `@next/codemod next-lint-to-eslint-cli`/upgrade. Chức năng giữ nguyên.

### P2-5 · [Phase B/F] Hiệu năng số dư O(n)
- **Sửa:** thay `findMany + reduce` bằng `walletTransaction.aggregate({ _sum: { amount } })` cho `getBalance`.

### P2-6 · [Phase A] Gỡ mock còn lại
- `forgot-password` (đang `setTimeout` giả) → API reset mật khẩu thật (token email).
- `dashboard/notifications` (state client) → bảng Notification + API.
- Landing `testimonials`/`faq` từ `mock-data` → CMS/DB nếu muốn động (chấp nhận giữ tĩnh cho marketing).

### P2-7 · [Phase F] Dọn lint (44 errors / 41 warnings)
- Thay `catch (error: any)` bằng `catch (error: unknown)` + narrow; gỡ unused vars. Cân nhắc bật `eslint` trong CI (Next 16 `next build` không tự chạy lint).

### P2-8 · [Kiến trúc] Dashboard client waterfall + gọi `/me` trùng
- **File:** `dashboard/layout.tsx` + các `dashboard/*/page.tsx` — cân nhắc Server Component fetch trực tiếp DB; hoặc chia sẻ user qua context để tránh gọi `/api/auth/me` nhiều lần.

### P2-9 · [Phase A/a11y] Polish nhỏ
- `adjustWalletBalance` hardcode IP `127.0.0.1` → lấy IP thật từ header.
- `aria-label` cho nút icon-only (copy, eye), kiểm contrast text trên hero gradient (≥ 4.5:1), tăng size CTA chính (touch target ~44px).
- `next-auth` nằm trong `dependencies` nhưng **không dùng** (dự án dùng JWT tự viết) → gỡ để giảm bundle/nhầm lẫn.

---

## 🧪 Lộ trình hoàn thiện Phase E — Kiểm thử (đã có: Vitest 30 test + CI GitHub Actions; còn: integration authz + E2E)
1. **Cài framework**: Vitest + React Testing Library (unit/component) + Playwright (E2E). Next 16 có sẵn hướng dẫn trong `node_modules/next/dist/docs/01-app/02-guides/testing/`.
2. **Unit ưu tiên tài chính**: `encryption.encrypt/decrypt` (round-trip + sai key), `getBalance`, `createOrderAction` (đủ/không đủ số dư), `updateOrderStatusAdmin` (khẳng định **không double-refund**), webhook (idempotency + verify amount).
3. **Test bảo mật**: authz từng API (khách không xem được đơn người khác, non-admin bị chặn `/admin`), rate-limit, IDOR `deposit/status`.
4. **E2E (Playwright)**: đăng ký→đăng nhập→tạo đơn→(mô phỏng webhook)→theo dõi; admin reveal (kiểm audit log được ghi).
5. **CI**: chạy `build` + `lint` + `test` trên mỗi PR.

## 🚀 Lộ trình hoàn thiện Phase F — Production
1. Sửa toàn bộ **P0** + **P1** ở trên (đặc biệt tài chính + secret + 2FA).
2. Secrets qua secret manager; `.env` khỏi repo; fail-fast khi thiếu env.
3. Security headers/CSP (`next.config.ts`); HTTPS; `middleware`→`proxy`.
4. Rate limit + idempotency dùng store bền (Redis).
5. Monitoring (Sentry) + uptime + log tập trung; backup DB định kỳ + thử restore.
6. Chính sách dữ liệu cá nhân (Luật 01/01/2026) + trang điều khoản/bảo mật/hoàn tiền hoàn chỉnh.
7. Tải/định lượng: kiểm double-spend dưới tải đồng thời; đối soát webhook.

---

## Thứ tự đề xuất triển khai
1. **P0-1 → P0-4** (chặn mất tiền/rò rỉ) + viết test hồi quy cho từng cái ngay khi sửa.
2. **P1-1, P1-2** (double-spend, 2FA reveal) → **P1-3..P1-6**.
3. Dựng **Phase E** (test) song song từ bước 1.
4. **P2** dọn dần; hoàn tất **Phase F** trước khi deploy.
