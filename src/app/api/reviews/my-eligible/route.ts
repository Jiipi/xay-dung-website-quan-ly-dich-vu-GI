/**
 * /api/reviews/my-eligible
 *
 *  - GET (customer): đơn hàng COMPLETED của user CHƯA được đánh giá.
 */

import { withApiHandler } from "@/lib/api-handler";
import { getUserReviewableOrders } from "@/modules/reviews/service";

export const GET = withApiHandler(
  { requireSession: true, requireRole: "CUSTOMER" },
  async ({ session }) => {
    const orders = await getUserReviewableOrders(session!.userId);
    return {
      success: true,
      orders: orders.map((o) => ({
        ...o,
        completedAt: o.completedAt.toISOString(),
      })),
    };
  }
);
