/**
 * /api/reviews/[id]/moderate
 *
 *  - PATCH (admin): duyệt hoặc từ chối review.
 *
 *  `reviewId` lấy từ URL param (route = `[id]`). Body chỉ cần `status`
 *  và (tùy chọn) `adminReply`.
 */

import { z } from "zod";
import { withApiHandler, parseBody } from "@/lib/api-handler";
import { moderateReview } from "@/modules/reviews/service";

const paramsSchema = z.object({ id: z.string().min(1) });
const bodySchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  adminReply: z.string().trim().max(500).optional(),
});

export const PATCH = withApiHandler(
  { requireSession: true, requireRole: "ADMIN" },
  async ({ request, params, session }) => {
    const { id } = paramsSchema.parse(params);
    const body = await parseBody(request, bodySchema);
    const review = await moderateReview(session!.userId, {
      reviewId: id,
      status: body.status,
      adminReply: body.adminReply,
    });
    return {
      success: true,
      review: { ...review, createdAt: review.createdAt.toISOString() },
    };
  }
);
