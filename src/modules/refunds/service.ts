/**
 * Domain module: Refunds.
 *
 * Quy tắc nghiệp vụ:
 *  - Mỗi đơn hàng chỉ có tối đa 1 RefundRequest (unique trên `orderId`).
 *  - Khách chỉ được yêu cầu hoàn tiền cho đơn của mình, trong vòng 7 ngày kể từ `updatedAt`.
 *  - Khách tự hủy được yêu cầu khi còn `PENDING`.
 *  - Admin xử lý: APPROVED tạo giao dịch ví hoàn (REFUND) + cập nhật trạng thái đơn.
 *    REJECTED đơn giữ nguyên.
 *  - Khi approve amount < order.amount -> đơn `PARTIALLY_REFUNDED`.
 *    Khi approve amount == order.amount -> đơn `REFUNDED`.
 */

import { db } from "@/lib/db";
import type { Prisma, RefundRequest } from "@prisma/client";
import type {
  CreateRefundRequestInput,
  ProcessRefundInput,
} from "@/lib/validation";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/modules/_shared/errors";
import { getBalanceInTx } from "@/modules/wallet/balance";

/** Số ngày tối đa sau khi đơn hoàn tất mà khách vẫn có thể yêu cầu hoàn tiền. */
const REFUND_WINDOW_DAYS = 7;

/* ============================================================================
 *  Helpers
 * ========================================================================== */

function toRefundStatus(value: string): RefundRequest["status"] {
  if (value === "PENDING" || value === "APPROVED" || value === "REJECTED" || value === "COMPLETED") {
    return value;
  }
  throw new ValidationError(`Refund status không hợp lệ: ${value}`);
}

function ensureOwnership(
  refund: { userId: string; orderId: string },
  userId: string,
  isAdmin: boolean
): void {
  if (!isAdmin && refund.userId !== userId) {
    throw new ForbiddenError("Bạn không có quyền truy cập yêu cầu hoàn tiền này");
  }
}

/* ============================================================================
 *  Public service functions
 * ========================================================================== */

/**
 * Khách hàng tạo yêu cầu hoàn tiền.
 *
 * Điều kiện:
 *  - Đơn hàng tồn tại, thuộc về `userId`.
 *  - Đơn đã thanh toán (status = `completed` | `cancelled` | `refunded` | `partially_refunded`).
 *    - `pending_payment` chưa thanh toán -> từ chối.
 *  - Đơn chưa có yêu cầu hoàn tiền nào.
 *  - Đơn phải được tạo trong vòng `REFUND_WINDOW_DAYS` ngày (tính theo `updatedAt`).
 *
 * @throws NotFoundError   khi không tìm thấy đơn.
 * @throws ForbiddenError  khi đơn không thuộc về user.
 * @throws ConflictError   khi đơn không hợp lệ trạng thái / đã có refund / quá hạn.
 */
export async function createRefundRequest(
  userId: string,
  input: CreateRefundRequestInput
): Promise<RefundRequest> {
  const order = await db.order.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      userId: true,
      amount: true,
      status: true,
      updatedAt: true,
      refundRequest: { select: { id: true } },
    },
  });

  if (!order) {
    throw new NotFoundError("Đơn hàng không tồn tại");
  }
  if (order.userId !== userId) {
    throw new ForbiddenError("Bạn không có quyền yêu cầu hoàn tiền đơn này");
  }
  if (order.refundRequest) {
    throw new ConflictError("Đơn hàng này đã có yêu cầu hoàn tiền trước đó");
  }

  // Đơn phải đã được thanh toán (không phải pending_payment)
  if (order.status === "pending_payment") {
    throw new ConflictError("Đơn hàng chưa thanh toán, không thể yêu cầu hoàn tiền");
  }

  // Cửa sổ hoàn tiền
  const windowMs = REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const ageMs = Date.now() - order.updatedAt.getTime();
  if (ageMs > windowMs) {
    throw new ConflictError(
      `Đã quá thời hạn hoàn tiền (${REFUND_WINDOW_DAYS} ngày kể từ cập nhật cuối)`
    );
  }

  // Mặc định amount = toàn bộ giá trị đơn (admin có thể giảm khi duyệt).
  return db.refundRequest.create({
    data: {
      orderId: order.id,
      userId,
      reason: input.reason,
      description: input.description ?? null,
      evidence: input.evidence ?? [],
      status: "PENDING",
      amount: order.amount,
    },
  });
}

/** Options danh sách refund (admin). */
export interface ListPendingOpts {
  page?: number;
  pageSize?: number;
}

/**
 * Danh sách yêu cầu hoàn tiền đang chờ xử lý (admin).
 */
export async function listPending(
  opts: ListPendingOpts = {}
): Promise<{ refunds: RefundRequest[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(opts.pageSize ?? 20)));
  const skip = (page - 1) * pageSize;

  const where: Prisma.RefundRequestWhereInput = { status: "PENDING" };

  const [refunds, total] = await db.$transaction([
    db.refundRequest.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip,
      take: pageSize,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            amount: true,
            service: { select: { name: true } },
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    db.refundRequest.count({ where }),
  ]);

  return { refunds, total, page, pageSize };
}

/**
 * Lấy refund theo orderId (nếu có). Customer chỉ truy cập được đơn của mình.
 */
export async function getByOrder(
  orderId: string,
  userId: string,
  isAdmin: boolean
): Promise<RefundRequest | null> {
  const refund = await db.refundRequest.findUnique({
    where: { orderId },
  });
  if (!refund) return null;
  ensureOwnership(refund, userId, isAdmin);
  return refund;
}

/**
 * Admin xử lý yêu cầu hoàn tiền.
 *
 *  - APPROVED: tạo WalletTransaction REFUND (+amount), cập nhật order status
 *    (`REFUNDED` nếu amount == order.amount, `PARTIALLY_REFUNDED` nếu nhỏ hơn),
 *    ghi `OrderStatusLog`.
 *  - REJECTED: chỉ cập nhật trạng thái refund + `resolution` (nếu có).
 *
 * @throws NotFoundError   khi không tìm thấy refund.
 * @throws ConflictError   khi refund không ở PENDING.
 * @throws ValidationError khi amount vượt giá trị đơn.
 */
export async function processRefund(
  adminId: string,
  input: ProcessRefundInput
): Promise<RefundRequest> {
  const decision = toRefundStatus(input.decision);

  const refund = await db.refundRequest.findUnique({
    where: { id: input.refundId },
    include: {
      order: {
        select: {
          id: true,
          userId: true,
          orderNumber: true,
          amount: true,
          status: true,
        },
      },
    },
  });

  if (!refund) {
    throw new NotFoundError("Yêu cầu hoàn tiền không tồn tại");
  }
  if (refund.status !== "PENDING") {
    throw new ConflictError(
      `Yêu cầu hoàn tiền đã ở trạng thái ${refund.status}, không thể xử lý lại`
    );
  }

  if (decision === "REJECTED") {
    return db.refundRequest.update({
      where: { id: refund.id },
      data: {
        status: "REJECTED",
        resolution: input.resolution ?? null,
        processedBy: adminId,
      },
    });
  }

  // APPROVED path
  const requestedAmount = input.refundAmount ?? refund.amount;
  if (requestedAmount <= 0) {
    throw new ValidationError("Số tiền hoàn phải lớn hơn 0");
  }
  if (requestedAmount > refund.order.amount) {
    throw new ValidationError(
      `Số tiền hoàn (${requestedAmount}) không được vượt quá giá trị đơn (${refund.order.amount})`
    );
  }

  const orderStatus: Prisma.OrderUpdateInput["status"] =
    requestedAmount >= refund.order.amount ? "refunded" : "partially_refunded";

  // Thực hiện tất cả trong 1 transaction để đảm bảo nhất quán.
  return db.$transaction(async (tx) => {
    // Cập nhật refund
    const updated = await tx.refundRequest.update({
      where: { id: refund.id },
      data: {
        status: "COMPLETED",
        amount: requestedAmount,
        resolution: input.resolution ?? null,
        processedBy: adminId,
      },
    });

    // Cập nhật trạng thái đơn + ghi log
    await tx.order.update({
      where: { id: refund.order.id },
      data: { status: orderStatus },
    });

    await tx.orderStatusLog.create({
      data: {
        orderId: refund.order.id,
        status: orderStatus,
        note: `Hoàn tiền ${requestedAmount.toLocaleString("vi-VN")}đ (refund #${refund.id})`,
        createdBy: adminId,
      },
    });

    // Ghi WalletTransaction REFUND (+amount) — đối ứng khoản hold/charge đã trừ.
    const previousBalance = await getBalanceInTx(tx, refund.order.userId);
    await tx.walletTransaction.create({
      data: {
        userId: refund.order.userId,
        type: "refund",
        amount: requestedAmount,
        balance: previousBalance + requestedAmount,
        description: `Hoàn tiền đơn ${refund.order.orderNumber} (refund #${refund.id})`,
        orderId: refund.order.id,
        status: "success",
      },
    });

    return updated;
  });
}

/**
 * Khách hàng hủy yêu cầu hoàn tiền khi còn PENDING.
 */
export async function cancelRefund(
  userId: string,
  refundId: string
): Promise<void> {
  const refund = await db.refundRequest.findUnique({
    where: { id: refundId },
    select: { id: true, userId: true, status: true },
  });
  if (!refund) {
    throw new NotFoundError("Yêu cầu hoàn tiền không tồn tại");
  }
  if (refund.userId !== userId) {
    throw new ForbiddenError("Bạn không có quyền hủy yêu cầu hoàn tiền này");
  }
  if (refund.status !== "PENDING") {
    throw new ConflictError(
      `Chỉ có thể hủy yêu cầu ở trạng thái PENDING (hiện tại: ${refund.status})`
    );
  }

  await db.refundRequest.delete({ where: { id: refundId } });
}
