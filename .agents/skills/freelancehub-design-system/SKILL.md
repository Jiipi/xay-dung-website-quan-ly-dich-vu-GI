---
name: freelancehub-design-system
description: Guidelines for high-fidelity UI design, theme colors, typography, and shadcn components.
---

# FreelanceHub Design System Skill

This skill enforces high-fidelity, premium visual design principles for FreelanceHub components and pages, inspired by modern SaaS interfaces like Linear, Stripe, and Notion, optimized for Vietnamese localization.

## 1. Visual Theme & Colors
- **Style:** Clean, spacious, with high-contrast, modern borders and subtle micro-animations on hover/active.
- **Color Palette (CSS Variable map or Tailwind classes):**
  - **Primary:** Indigo / Blue (`bg-indigo-600` / `hover:bg-indigo-700` / `text-indigo-600`). Hex: `#2563EB` (Primary), `#1D4ED8` (Primary Dark).
  - **Accent:** Emerald / Cyan (`text-emerald-600` / `bg-emerald-500` / `bg-cyan-500`). Hex: `#10B981`.
  - **Background:** Slate / Neutral light (`bg-slate-50` / `bg-slate-100` for light mode; or Slate-950 for dark mode).
  - **Text:** Slate-900 (`text-slate-900` / `#0F172A`) for main body; Slate-500 (`text-slate-500` / `#64748B`) for muted labels.
  - **Status Badges:**
    - **Draft / Nháp:** Slate (`bg-slate-100 text-slate-700`)
    - **Sent / Đã gửi:** Indigo / Blue (`bg-blue-50 text-blue-700`)
    - **Viewed / Đã xem:** Cyan (`bg-cyan-50 text-cyan-700`)
    - **Approved / Đã duyệt / Signed / Đã ký / Paid / Đã thanh toán:** Emerald / Green (`bg-emerald-50 text-emerald-700`)
    - **Rejected / Từ chối / Cancelled / Đã hủy:** Red (`bg-red-50 text-red-700`)
    - **Partially Paid / Thanh toán một phần / Overdue / Quá hạn:** Amber / Orange (`bg-amber-50 text-amber-700`)

## 2. Typography
- **Landing Page Font:** `Be Vietnam Pro` (Vietnamese-native, sleek, and friendly).
- **Dashboard / Admin App Font:** `Inter` or `Be Vietnam Pro` (Highly readable for data density).

## 3. UI Guidelines
- **Responsive Layouts:** Every page must work seamlessly on Mobile (Client-facing pages are critical for phone views, e.g., viewing quotes, checking invoices, signing contracts, uploading transfer receipts).
- **Empty States:** When a list is empty (e.g., no clients yet), show an illustrative, high-quality empty state with a clear CTA button (e.g., "Thêm khách hàng đầu tiên").
- **Friction-Free Portals:** The client portal must look premium and offer passwordless magic-link or OTP login so clients can access documents instantly without complex registration workflows.
- **Dynamic Elements:** Buttons must have transition effects (`transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-md`).
