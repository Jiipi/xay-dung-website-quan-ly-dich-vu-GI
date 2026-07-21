/**
 * /api/coupons/validate
 *
 *  - POST (authenticated): kiểm tra & tính discount cho 1 mã.
 *    Body: { code, orderAmount, serviceId?, categoryId? }.
 */

import { z } from "zod";
import {
  withApiHandler,
  parseBody,
} from "@/lib/api-handler";
import { validateCoupon } from "@/modules/promotions/service";

const bodySchema = z.object({
  code: z.string().trim().toUpperCase().min(2).max(40),
  orderAmount: z.number().positive(),
  serviceId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
});

export const POST = withApiHandler(
  { requireSession: true },
  async ({ request, session }) => {
    const body = await parseBody(request, bodySchema);
    const result = await validateCoupon(
      body.code,
      session!.userId,
      body.orderAmount,
      {
        serviceId: body.serviceId,
        categoryId: body.categoryId,
      }
    );
    return {
      success: true,
      coupon: {
        id: result.coupon.id,
        code: result.coupon.code,
        description: result.coupon.description,
        discountType: result.coupon.discountType,
        discount: result.coupon.discount,
        maxDiscount: result.coupon.maxDiscount,
        minOrderValue: result.coupon.minOrderValue,
        expiresAt: result.coupon.expiresAt.toISOString(),
      },
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
    };
  }
);
