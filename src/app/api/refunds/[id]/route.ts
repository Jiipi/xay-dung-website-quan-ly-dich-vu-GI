/**
 * /api/refunds/[id]
 *
 *  - GET: chi tiết yêu cầu hoàn tiền (customer chỉ của mình, admin xem tất cả).
 *  - PATCH:
 *      + admin: xử lý (APPROVED/REJECTED).
 *      + customer: hủy yêu cầu (khi còn PENDING).
 */

import { z } from "zod";
import {
  withApiHandler,
  parseBody,
} from "@/lib/api-handler";
import { db } from "@/lib/db";
import {
  cancelRefund,
  processRefund,
} from "@/modules/refunds/service";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/modules/_shared/errors";

const paramsSchema = z.object({ id: z.string().min(1) });

const processBodySchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  resolution: z.string().trim().max(500).optional(),
  refundAmount: z.number().positive().optional(),
});

export const GET = withApiHandler(
  { requireSession: true },
  async ({ params, session }) => {
    const { id } = paramsSchema.parse(params);
    const isAdmin = session!.role === "ADMIN";
    const refund = await db.refundRequest.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            amount: true,
            status: true,
            service: { select: { name: true } },
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!refund) {
      throw new NotFoundError("Yêu cầu hoàn tiền không tồn tại");
    }
    if (!isAdmin && refund.userId !== session!.userId) {
      throw new ForbiddenError("Bạn không có quyền xem yêu cầu hoàn tiền này");
    }
    return {
      success: true,
      refund: {
        ...refund,
        createdAt: refund.createdAt.toISOString(),
        updatedAt: refund.updatedAt.toISOString(),
      },
    };
  }
);

export const PATCH = withApiHandler(
  { requireSession: true },
  async ({ request, params, session }) => {
    const { id } = paramsSchema.parse(params);
    const body = await parseBody(request, processBodySchema);
    const isAdmin = session!.role === "ADMIN";

    if (!isAdmin) {
      // Customer chỉ được hủy refund PENDING của mình.
      // Lấy refund để kiểm tra ownership trước.
      const existing = await db.refundRequest.findUnique({
        where: { id },
        select: { id: true, userId: true, status: true },
      });
      if (!existing) throw new NotFoundError("Yêu cầu hoàn tiền không tồn tại");
      if (existing.userId !== session!.userId) {
        throw new ForbiddenError(
          "Bạn không có quyền thao tác yêu cầu hoàn tiền này"
        );
      }
      if (existing.status !== "PENDING") {
        throw new ConflictError(
          "Chỉ có thể hủy yêu cầu đang ở trạng thái PENDING"
        );
      }
      await cancelRefund(session!.userId, id);
      return { success: true, cancelled: true };
    }

    // Admin xử lý.
    const refund = await processRefund(session!.userId, {
      refundId: id,
      decision: body.decision,
      resolution: body.resolution,
      refundAmount: body.refundAmount,
    });
    return {
      success: true,
      refund: {
        ...refund,
        createdAt: refund.createdAt.toISOString(),
        updatedAt: refund.updatedAt.toISOString(),
      },
    };
  }
);
