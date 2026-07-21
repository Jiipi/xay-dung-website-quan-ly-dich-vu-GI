/**
 * /api/refunds
 *
 *  - POST (customer): tạo yêu cầu hoàn tiền.
 *  - GET:
 *      + admin: danh sách PENDING (chờ duyệt).
 *      + customer: danh sách yêu cầu của chính họ.
 */

import { db } from "@/lib/db";
import {
  withApiHandler,
  parseBody,
  readQueryNumber,
} from "@/lib/api-handler";
import { createRefundRequestSchema } from "@/lib/validation";
import {
  createRefundRequest,
  listPending,
} from "@/modules/refunds/service";

export const POST = withApiHandler(
  { requireSession: true, requireRole: "CUSTOMER" },
  async ({ request, session }) => {
    const body = await parseBody(request, createRefundRequestSchema);
    const refund = await createRefundRequest(session!.userId, body);
    return {
      success: true,
      refund: serializeRefund(refund),
    };
  }
);

export const GET = withApiHandler(
  { requireSession: true },
  async ({ request, session }) => {
    const url = new URL(request.url);
    const page = readQueryNumber(url, "page", 1);
    const pageSize = readQueryNumber(url, "pageSize", 20);

    if (session!.role === "ADMIN") {
      const data = await listPending({ page, pageSize });
      return {
        success: true,
        role: "ADMIN",
        refunds: data.refunds.map(serializeRefund),
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
      };
    }

    // Customer: danh sách refund của chính họ.
    const where = { userId: session!.userId };
    const [refunds, total] = await db.$transaction([
      db.refundRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              service: { select: { name: true } },
            },
          },
        },
      }),
      db.refundRequest.count({ where }),
    ]);
    return {
      success: true,
      role: "CUSTOMER",
      refunds: refunds.map((r) => ({
        ...serializeRefund(r),
        orderNumber: r.order.orderNumber,
        serviceName: r.order.service.name,
      })),
      total,
      page,
      pageSize,
    };
  }
);

function serializeRefund<
  T extends {
    createdAt: Date;
    updatedAt: Date;
  }
>(refund: T) {
  return {
    ...refund,
    createdAt: refund.createdAt.toISOString(),
    updatedAt: refund.updatedAt.toISOString(),
  };
}
