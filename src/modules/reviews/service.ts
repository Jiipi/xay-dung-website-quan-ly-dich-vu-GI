/**
 * Domain module: Reviews.
 *
 * Quy tắc nghiệp vụ:
 *  - Mỗi đơn COMPLETED chỉ được đánh giá MỘT LẦN (unique trên `orderId`).
 *  - Review mới tạo có trạng thái `PENDING`; chỉ `APPROVED` mới hiển thị public.
 *  - Lịch sử reviewable của user là các đơn COMPLETED, CHƯA review.
 *  - Admin được duyệt và có thể đính kèm phản hồi (`adminReply`).
 */

import type { Prisma, Review, ReviewStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type {
  CreateReviewInput,
  ModerateReviewInput,
} from "@/lib/validation";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/modules/_shared/errors";

/* ============================================================================
 *  Helpers — ép kiểu review status sang union literal.
 * ========================================================================== */

const REVIEW_STATUS_VALUES: ReviewStatus[] = ["PENDING", "APPROVED", "REJECTED"];

function asReviewStatus(value: string): ReviewStatus {
  if ((REVIEW_STATUS_VALUES as string[]).includes(value)) {
    return value as ReviewStatus;
  }
  throw new ValidationError(`Review status không hợp lệ: ${value}`);
}

/* ============================================================================
 *  Public service functions
 * ========================================================================== */

/**
 * Tạo review mới cho đơn hàng đã hoàn tất.
 *
 * Điều kiện:
 *  - Đơn hàng phải tồn tại và thuộc về `userId`.
 *  - Trạng thái đơn = `"completed"`.
 *  - Chưa có review nào cho order này (unique trên `orderId`).
 *
 * @throws NotFoundError  khi không tìm thấy đơn hàng.
 * @throws ForbiddenError khi đơn không thuộc về user.
 * @throws ConflictError  khi đơn chưa hoàn tất hoặc đã có review.
 */
export async function createReview(
  userId: string,
  input: CreateReviewInput
): Promise<Review> {
  const order = await db.order.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      userId: true,
      serviceId: true,
      status: true,
      review: { select: { id: true } },
    },
  });

  if (!order) {
    throw new NotFoundError("Đơn hàng không tồn tại");
  }
  if (order.userId !== userId) {
    throw new ForbiddenError("Bạn không có quyền đánh giá đơn hàng này");
  }
  if (order.status !== "completed" && order.status !== "COMPLETED") {
    throw new ConflictError("Chỉ có thể đánh giá đơn hàng đã hoàn tất");
  }
  if (order.review) {
    throw new ConflictError("Đơn hàng này đã được đánh giá trước đó");
  }

  return db.review.create({
    data: {
      userId,
      orderId: order.id,
      serviceId: order.serviceId,
      rating: input.rating,
      content: input.content,
      images: input.images ?? [],
      status: "PENDING",
    },
  });
}

/**
 * Danh sách review đã được duyệt cho 1 dịch vụ (public).
 *
 * @param opts.page     trang hiện tại (>=1)
 * @param opts.pageSize số bản ghi / trang (<=100)
 */
export interface ListApprovedOpts {
  page?: number;
  pageSize?: number;
}

export async function listServiceReviews(
  serviceId: string,
  opts: ListApprovedOpts = {}
): Promise<{ reviews: Review[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(opts.pageSize ?? 20)));
  const skip = (page - 1) * pageSize;

  const where: Prisma.ReviewWhereInput = {
    serviceId,
    status: "APPROVED",
  };

  const [reviews, total] = await db.$transaction([
    db.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.review.count({ where }),
  ]);

  return { reviews, total, page, pageSize };
}

/**
 * Danh sách review chờ duyệt (admin).
 */
export interface ListPendingOpts {
  page?: number;
  pageSize?: number;
}

export async function listPendingReviews(
  opts: ListPendingOpts = {}
): Promise<{ reviews: Review[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(opts.pageSize ?? 20)));
  const skip = (page - 1) * pageSize;

  const where: Prisma.ReviewWhereInput = { status: "PENDING" };

  const [reviews, total] = await db.$transaction([
    db.review.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip,
      take: pageSize,
      include: {
        user: { select: { id: true, name: true, email: true } },
        service: { select: { id: true, name: true } },
      },
    }),
    db.review.count({ where }),
  ]);

  return { reviews, total, page, pageSize };
}

/**
 * Duyệt / từ chối review.
 *
 * @throws NotFoundError khi không tìm thấy review.
 */
export async function moderateReview(
  _adminId: string,
  input: ModerateReviewInput
): Promise<Review> {
  const targetStatus = asReviewStatus(input.status);

  const existing = await db.review.findUnique({
    where: { id: input.reviewId },
    select: { id: true, status: true },
  });
  if (!existing) {
    throw new NotFoundError("Review không tồn tại");
  }
  if (existing.status !== "PENDING") {
    throw new ConflictError(
      `Review đã ở trạng thái ${existing.status}, không thể duyệt lại`
    );
  }

  return db.review.update({
    where: { id: input.reviewId },
    data: {
      status: targetStatus,
      adminReply: input.adminReply ?? null,
    },
  });
}

/**
 * Danh sách đơn hàng COMPLETED của user CHƯA có review.
 * Dùng cho màn "đánh giá đơn đã hoàn tất".
 */
export async function getUserReviewableOrders(userId: string): Promise<
  Array<{
    id: string;
    orderNumber: string;
    serviceId: string;
    serviceName: string;
    completedAt: Date;
  }>
> {
  const orders = await db.order.findMany({
    where: {
      userId,
      status: "completed",
      review: { is: null },
    },
    select: {
      id: true,
      orderNumber: true,
      serviceId: true,
      updatedAt: true,
      service: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    serviceId: o.serviceId,
    serviceName: o.service.name,
    completedAt: o.updatedAt,
  }));
}

/**
 * Thống kê rating cho dịch vụ (chỉ tính review APPROVED).
 */
export interface ServiceRatingStats {
  avg: number;
  count: number;
  histogram: Record<1 | 2 | 3 | 4 | 5, number>;
}

export async function getServiceRatingStats(
  serviceId: string
): Promise<ServiceRatingStats> {
  const groups = await db.review.groupBy({
    by: ["rating"],
    where: { serviceId, status: "APPROVED" },
    _count: { _all: true },
  });

  const histogram: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  let total = 0;
  let sum = 0;
  for (const g of groups) {
    const r = g.rating as 1 | 2 | 3 | 4 | 5;
    if (r >= 1 && r <= 5) {
      const c = g._count._all;
      histogram[r] = c;
      total += c;
      sum += r * c;
    }
  }

  return {
    avg: total === 0 ? 0 : Math.round((sum / total) * 100) / 100,
    count: total,
    histogram,
  };
}
