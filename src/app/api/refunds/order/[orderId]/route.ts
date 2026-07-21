/**
 * /api/refunds/order/[orderId]
 *
 *  - GET: refund gắn với đơn hàng (nếu có). Customer chỉ truy cập đơn của mình.
 */

import { z } from "zod";
import { withApiHandler } from "@/lib/api-handler";
import { getByOrder } from "@/modules/refunds/service";
import { ForbiddenError, NotFoundError } from "@/modules/_shared/errors";
import { db } from "@/lib/db";

const paramsSchema = z.object({ orderId: z.string().min(1) });

export const GET = withApiHandler(
  { requireSession: true },
  async ({ params, session }) => {
    const { orderId } = paramsSchema.parse(params);
    const isAdmin = session!.role === "ADMIN";

    // Đảm bảo customer chỉ xem được đơn của mình khi chưa có refund.
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true },
    });
    if (!order) {
      throw new NotFoundError("Đơn hàng không tồn tại");
    }
    if (!isAdmin && order.userId !== session!.userId) {
      throw new ForbiddenError("Bạn không có quyền truy cập đơn hàng này");
    }

    const refund = await getByOrder(orderId, session!.userId, isAdmin);
    if (!refund) {
      return { success: true, refund: null };
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
