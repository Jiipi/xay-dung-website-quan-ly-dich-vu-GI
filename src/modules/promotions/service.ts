/**
 * Domain module: Promotions / Coupons.
 *
 * Quy tắc nghiệp vụ:
 *  - Mỗi Coupon có mã (code) duy nhất, phân biệt HOA/thường (uppercase khi lưu).
 *  - Có thể giới hạn áp dụng theo `serviceIds`, `categoryIds` hoặc `userRestrictions`.
 *  - Kiểm tra coupon gồm: tồn tại, đang active, trong cửa sổ thời gian,
 *    đạt `minOrderValue`, thỏa `appliesTo` (serviceId / categoryId),
 *    chưa vượt `usageLimit` / `usagePerUser`.
 *  - Khi đặt hàng, khách hàng phải dùng `redeemCoupon` trong transaction
 *    để tạo `CouponRedemption` (mỗi đơn tối đa 1 redemption, unique orderId).
 *
 * Public:
 *  - `validateCoupon`: kiểm tra & tính discount, KHÔNG ghi DB.
 *  - `redeemCoupon`: ghi `CouponRedemption` (gọi trong transaction đặt hàng).
 *  - `listActiveCoupons`: liệt kê coupon đang khả dụng cho trang /promotions.
 */

import { db } from "@/lib/db";
import type { Coupon, CouponRedemption, Prisma } from "@prisma/client";
import type {
  ApplyCouponInput,
  CreateCouponInput,
} from "@/lib/validation";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/modules/_shared/errors";

/* ============================================================================
 *  Helpers
 * ========================================================================== */

/**
 * Tính số tiền được giảm dựa trên loại coupon & giá trị đơn.
 *
 *  - PERCENT: `discount` là phần trăm (1-100).
 *  - FIXED:   `discount` là số tiền cố định.
 *
 * Áp dụng `maxDiscount` (nếu có) để clamp phần trăm.
 */
export function computeDiscount(
  coupon: Pick<Coupon, "discountType" | "discount" | "maxDiscount">,
  orderAmount: number
): number {
  let raw: number;
  if (coupon.discountType === "PERCENT") {
    raw = (orderAmount * coupon.discount) / 100;
    if (coupon.maxDiscount != null) {
      raw = Math.min(raw, coupon.maxDiscount);
    }
  } else {
    raw = coupon.discount;
  }
  // Không bao giờ vượt quá giá trị đơn và không âm.
  if (raw < 0) raw = 0;
  if (raw > orderAmount) raw = orderAmount;
  // Làm tròn xuống đến đơn vị đồng.
  return Math.floor(raw);
}

/* ============================================================================
 *  Admin operations
 * ========================================================================== */

/** Options lọc / phân trang cho admin. */
export interface ListCouponsAdminOpts {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}

/**
 * Danh sách coupon cho admin (lọc + phân trang).
 */
export async function listCouponsAdmin(
  opts: ListCouponsAdminOpts = {}
): Promise<{ coupons: Coupon[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(opts.pageSize ?? 20)));
  const skip = (page - 1) * pageSize;

  const where: Prisma.CouponWhereInput = {};
  if (typeof opts.isActive === "boolean") {
    where.isActive = opts.isActive;
  }
  if (opts.search) {
    const q = opts.search.trim();
    if (q.length > 0) {
      where.OR = [
        { code: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }
  }

  const [coupons, total] = await db.$transaction([
    db.coupon.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: pageSize }),
    db.coupon.count({ where }),
  ]);

  return { coupons, total, page, pageSize };
}

/**
 * Tạo coupon mới.
 *
 * @throws ConflictError khi mã đã tồn tại.
 * @throws ValidationError khi percent không hợp lệ (1-100).
 */
export async function createCoupon(input: CreateCouponInput): Promise<Coupon> {
  if (input.discountType === "PERCENT" && input.discount > 100) {
    throw new ValidationError("Giảm giá theo % không được vượt quá 100");
  }

  const existing = await db.coupon.findUnique({
    where: { code: input.code },
    select: { id: true },
  });
  if (existing) {
    throw new ConflictError(`Mã coupon "${input.code}" đã tồn tại`);
  }

  return db.coupon.create({
    data: {
      code: input.code,
      description: input.description ?? null,
      discountType: input.discountType,
      discount: input.discount,
      maxDiscount: input.maxDiscount ?? null,
      minOrderValue: input.minOrderValue ?? 0,
      usageLimit: input.usageLimit ?? null,
      usagePerUser: input.usagePerUser ?? 1,
      appliesToAll: input.appliesToAll ?? true,
      serviceIds: input.serviceIds ?? [],
      categoryIds: input.categoryIds ?? [],
      expiresAt: input.expiresAt,
      isActive: true,
    },
  });
}

/** Payload update — tất cả field optional ngoại trừ id. */
export interface UpdateCouponInput {
  description?: string | null;
  discount?: number;
  maxDiscount?: number | null;
  minOrderValue?: number;
  usageLimit?: number | null;
  usagePerUser?: number;
  appliesToAll?: boolean;
  serviceIds?: string[];
  categoryIds?: string[];
  isActive?: boolean;
  expiresAt?: Date;
}

/**
 * Cập nhật coupon. KHÔNG cho phép đổi mã (code là định danh).
 */
export async function updateCoupon(
  id: string,
  input: UpdateCouponInput
): Promise<Coupon> {
  const existing = await db.coupon.findUnique({
    where: { id },
    select: { id: true, discountType: true },
  });
  if (!existing) {
    throw new NotFoundError("Coupon không tồn tại");
  }

  if (input.discount !== undefined) {
    if (input.discount <= 0) {
      throw new ValidationError("Giá trị giảm phải lớn hơn 0");
    }
    if (existing.discountType === "PERCENT" && input.discount > 100) {
      throw new ValidationError("Giảm giá theo % không được vượt quá 100");
    }
  }
  if (input.expiresAt && input.expiresAt.getTime() <= Date.now()) {
    throw new ValidationError("Ngày hết hạn phải ở tương lai");
  }

  return db.coupon.update({
    where: { id },
    data: {
      description: input.description,
      discount: input.discount,
      maxDiscount: input.maxDiscount,
      minOrderValue: input.minOrderValue,
      usageLimit: input.usageLimit,
      usagePerUser: input.usagePerUser,
      appliesToAll: input.appliesToAll,
      serviceIds: input.serviceIds,
      categoryIds: input.categoryIds,
      isActive: input.isActive,
      expiresAt: input.expiresAt,
    },
  });
}

/**
 * Xóa coupon. Thất bại nếu đã có redemption (FK cascade onDelete được set,
 * nhưng thường nên cảnh báo trước ở route).
 */
export async function deleteCoupon(id: string): Promise<void> {
  const existing = await db.coupon.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    throw new NotFoundError("Coupon không tồn tại");
  }
  await db.coupon.delete({ where: { id } });
}

/* ============================================================================
 *  Public operations (validate, redeem)
 * ========================================================================== */

export interface ValidateCouponContext {
  /** serviceId của dịch vụ trong đơn (để check `appliesTo`). */
  serviceId?: string;
  /** categoryId của dịch vụ trong đơn (để check `appliesTo`). */
  categoryId?: string;
}

export interface ValidateCouponResult {
  coupon: Coupon;
  discountAmount: number;
  finalAmount: number;
}

/**
 * Kiểm tra & tính discount cho 1 mã coupon.
 *
 * KHÔNG ghi DB — gọi trước khi tạo đơn để hiển thị preview.
 *
 * @throws NotFoundError    mã không tồn tại.
 * @throws ConflictError    không thỏa điều kiện áp dụng (đã hết hạn, hết lượt, không thuộc service/category...).
 * @throws ValidationError  đơn chưa đạt `minOrderValue`.
 */
export async function validateCoupon(
  code: string,
  userId: string,
  orderAmount: number,
  ctx: ValidateCouponContext = {}
): Promise<ValidateCouponResult> {
  if (!Number.isFinite(orderAmount) || orderAmount <= 0) {
    throw new ValidationError("Giá trị đơn hàng không hợp lệ");
  }

  const coupon = await db.coupon.findUnique({ where: { code } });
  if (!coupon) {
    throw new NotFoundError("Mã giảm giá không tồn tại");
  }
  if (!coupon.isActive) {
    throw new ConflictError("Mã giảm giá đang tạm khóa");
  }

  const now = Date.now();
  if (coupon.startsAt && coupon.startsAt.getTime() > now) {
    throw new ConflictError("Mã giảm giá chưa tới thời gian áp dụng");
  }
  if (coupon.expiresAt.getTime() < now) {
    throw new ConflictError("Mã giảm giá đã hết hạn");
  }

  if (orderAmount < coupon.minOrderValue) {
    throw new ValidationError(
      `Đơn hàng phải tối thiểu ${coupon.minOrderValue.toLocaleString("vi-VN")}đ để áp dụng mã này`
    );
  }

  // userRestrictions: nếu mảng không rỗng thì userId phải nằm trong danh sách.
  if (
    coupon.userRestrictions.length > 0 &&
    !coupon.userRestrictions.includes(userId)
  ) {
    throw new ConflictError("Mã giảm giá không áp dụng cho tài khoản của bạn");
  }

  // appliesTo: nếu không áp dụng cho tất cả -> check serviceId / categoryId.
  if (!coupon.appliesToAll) {
    if (ctx.serviceId && !coupon.serviceIds.includes(ctx.serviceId)) {
      throw new ConflictError("Mã giảm giá không áp dụng cho dịch vụ này");
    }
    if (ctx.categoryId && !coupon.categoryIds.includes(ctx.categoryId)) {
      throw new ConflictError("Mã giảm giá không áp dụng cho danh mục này");
    }
    // Nếu truyền rỗng -> bắt buộc xác định dịch vụ/danh mục để check.
    if (!ctx.serviceId && !ctx.categoryId) {
      throw new ValidationError(
        "Cần chỉ định dịch vụ hoặc danh mục để kiểm tra mã giảm giá"
      );
    }
  }

  // usageLimit (toàn cục)
  if (coupon.usageLimit != null) {
    const totalUsed = await db.couponRedemption.count({
      where: { couponId: coupon.id },
    });
    if (totalUsed >= coupon.usageLimit) {
      throw new ConflictError("Mã giảm giá đã hết lượt sử dụng");
    }
  }

  // usagePerUser
  const userUsed = await db.couponRedemption.count({
    where: { couponId: coupon.id, userId },
  });
  if (userUsed >= coupon.usagePerUser) {
    throw new ConflictError(
      `Bạn đã sử dụng mã này ${userUsed}/${coupon.usagePerUser} lần`
    );
  }

  const discountAmount = computeDiscount(coupon, orderAmount);
  const finalAmount = Math.max(0, orderAmount - discountAmount);

  return { coupon, discountAmount, finalAmount };
}

/**
 * Ghi nhận coupon đã sử dụng cho 1 đơn hàng.
 *
 * PHẢI gọi trong transaction của đặt hàng (truyền `tx` qua `Prisma.TransactionClient`).
 *
 * Validate lại trước khi ghi để chống race condition (2 đơn đồng thời dùng
 * cùng mã khi chỉ còn 1 lượt).
 *
 * @throws ConflictError khi đơn đã có redemption hoặc đã hết lượt.
 */
export async function redeemCoupon(
  tx: Prisma.TransactionClient,
  userId: string,
  couponId: string,
  orderId: string,
  discountAmount: number
): Promise<CouponRedemption> {
  const existing = await tx.couponRedemption.findUnique({
    where: { orderId },
    select: { id: true },
  });
  if (existing) {
    throw new ConflictError("Đơn hàng này đã sử dụng mã giảm giá");
  }

  const coupon = await tx.coupon.findUnique({
    where: { id: couponId },
    select: { usageLimit: true, usagePerUser: true },
  });
  if (!coupon) {
    throw new NotFoundError("Coupon không tồn tại");
  }

  if (coupon.usageLimit != null) {
    const total = await tx.couponRedemption.count({ where: { couponId } });
    if (total >= coupon.usageLimit) {
      throw new ConflictError("Mã giảm giá đã hết lượt sử dụng");
    }
  }
  const userTotal = await tx.couponRedemption.count({
    where: { couponId, userId },
  });
  if (userTotal >= coupon.usagePerUser) {
    throw new ConflictError("Bạn đã dùng hết lượt cho mã giảm giá này");
  }

  return tx.couponRedemption.create({
    data: {
      couponId,
      userId,
      orderId,
      discountAmount,
    },
  });
}

/**
 * Danh sách coupon public đang khả dụng (còn hạn + active + còn lượt).
 * Không kèm số liệu nội bộ (usageLimit, userRestrictions...).
 */
export async function listActiveCoupons(): Promise<Coupon[]> {
  const now = new Date();
  const coupons = await db.coupon.findMany({
    where: {
      isActive: true,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });

  // Lọc tiếp: chưa hết lượt toàn cục.
  // Vì usageLimit có thể null (không giới hạn) nên cần đếm riêng.
  const results: Coupon[] = [];
  for (const c of coupons) {
    if (c.usageLimit == null) {
      results.push(c);
      continue;
    }
    const used = await db.couponRedemption.count({ where: { couponId: c.id } });
    if (used < c.usageLimit) results.push(c);
  }
  return results;
}

/**
 * Thống kê 1 coupon (admin).
 */
export interface CouponStats {
  usageCount: number;
  totalDiscount: number;
  perUserLimit: number;
}

export async function getCouponStats(couponId: string): Promise<CouponStats> {
  const coupon = await db.coupon.findUnique({
    where: { id: couponId },
    select: { id: true, usagePerUser: true },
  });
  if (!coupon) {
    throw new NotFoundError("Coupon không tồn tại");
  }
  const agg = await db.couponRedemption.aggregate({
    where: { couponId },
    _sum: { discountAmount: true },
    _count: { _all: true },
  });
  return {
    usageCount: agg._count._all,
    totalDiscount: agg._sum.discountAmount ?? 0,
    perUserLimit: coupon.usagePerUser,
  };
}

/** Cấu trúc input mở rộng cho validate (route handler có thể dùng). */
export type ValidateCouponInput = ApplyCouponInput;
