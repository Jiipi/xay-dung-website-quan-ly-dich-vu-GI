/**
 * /api/reviews
 *
 *  - GET  ?serviceId=&page=&pageSize=: danh sách review APPROVED cho dịch vụ (public).
 *  - POST: khách hàng tạo review cho đơn COMPLETED.
 */

import { z } from "zod";
import { db } from "@/lib/db";
import {
  withApiHandler,
  parseBody,
  readQueryNumber,
  readQueryString,
} from "@/lib/api-handler";
import {
  createReviewSchema,
} from "@/lib/validation";
import {
  createReview,
  listServiceReviews,
  getServiceRatingStats,
} from "@/modules/reviews/service";

const listQuerySchema = z.object({
  serviceId: z.string().min(1),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const GET = withApiHandler(undefined, async ({ request }) => {
  const url = new URL(request.url);
  const raw = {
    serviceId: readQueryString(url, "serviceId", ""),
    page: readQueryNumber(url, "page", 1),
    pageSize: readQueryNumber(url, "pageSize", 20),
  };
  const parsed = listQuerySchema.parse(raw);

  const [data, stats] = await Promise.all([
    listServiceReviews(parsed.serviceId, {
      page: parsed.page,
      pageSize: parsed.pageSize,
    }),
    getServiceRatingStats(parsed.serviceId),
  ]);

  // Bổ sung tên người dùng cho FE (chỉ trả tên + email masked).
  const userIds = Array.from(new Set(data.reviews.map((r) => r.userId)));
  const users = userIds.length
    ? await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  return {
    success: true,
    reviews: data.reviews.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      userName: userMap.get(r.userId) ?? "Người dùng",
    })),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
    stats,
  };
});

export const POST = withApiHandler(
  { requireSession: true, requireRole: "CUSTOMER" },
  async ({ request, session }) => {
    const body = await parseBody(request, createReviewSchema);
    const review = await createReview(session!.userId, body);
    return {
      success: true,
      review: { ...review, createdAt: review.createdAt.toISOString() },
    };
  }
);
