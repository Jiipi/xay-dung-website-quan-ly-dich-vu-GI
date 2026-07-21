import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payOS } from "@/lib/payos";
import { resolveWebhookIdempotencyKey, amountsMatch } from "@/lib/payos-webhook";
import { getBalanceInTx } from "@/modules/wallet/balance";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Verify chữ ký bằng SDK payOS
    let webhookData;
    try {
      webhookData = await payOS.webhooks.verify(body);
    } catch (err) {
      logger.error("payos_webhook_signature_invalid", {
        error: err instanceof Error ? err.message : String(err),
      });
      return NextResponse.json(
        { error: "Chữ ký webhook không hợp lệ" },
        { status: 400 }
      );
    }

    const { orderCode, amount, description, reference, paymentLinkId } = webhookData;

    // 2. Khóa idempotency ỔN ĐỊNH (không dùng Date.now()) — chống cộng tiền trùng khi PayOS retry
    let webhookId: string;
    try {
      webhookId = resolveWebhookIdempotencyKey({ reference, paymentLinkId, orderCode });
    } catch (err) {
      logger.error("payos_webhook_missing_id", {
        error: err instanceof Error ? err.message : String(err),
      });
      return NextResponse.json(
        { error: "Webhook thiếu định danh giao dịch" },
        { status: 400 }
      );
    }

    const existingEvent = await db.paymentWebhookEvent.findUnique({
      where: { webhookId },
    });
    if (existingEvent) {
      console.log(`Webhook ${webhookId} đã xử lý trước đó — bỏ qua để tránh cộng tiền trùng.`);
      return NextResponse.json({ success: true, message: "Webhook already processed" });
    }

    // 3. Xử lý trong transaction. Ghi event TRƯỚC (dù kết quả gì) để đảm bảo idempotent.
    const result = await db.$transaction(async (tx) => {
      await tx.paymentWebhookEvent.create({
        data: { webhookId, payload: body, processed: true },
      });

      // Tìm PaymentIntent khớp orderCode và đang chờ
      const paymentIntent = await tx.paymentIntent.findFirst({
        where: {
          content: { contains: String(orderCode) },
          status: "pending",
        },
      });

      if (!paymentIntent) {
        return { ok: false as const, reason: "no_intent" as const };
      }

      // 3b. VERIFY SỐ TIỀN — chống cộng sai số tiền so với yêu cầu nạp đã tạo
      if (!amountsMatch(amount, paymentIntent.amount)) {
        return {
          ok: false as const,
          reason: "amount_mismatch" as const,
          expected: paymentIntent.amount,
          got: amount,
        };
      }

      await tx.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: { status: "completed" },
      });

      // Tính số dư từ sổ cái (nhất quán với getBalance)
      const previousBalance = await getBalanceInTx(tx, paymentIntent.userId);

      const walletTx = await tx.walletTransaction.create({
        data: {
          userId: paymentIntent.userId,
          type: "deposit",
          amount,
          balance: previousBalance + amount,
          description: `Nạp tiền tự động qua QR VietQR - Nội dung: ${description}`,
          status: "success",
        },
      });

      return { ok: true as const, walletTx };
    });

    if (!result.ok) {
      if (result.reason === "amount_mismatch") {
        logger.warn("payos_webhook_amount_mismatch", {
          webhookId,
          expected: result.expected,
          got: result.got,
        });
        // Đã ghi event (idempotent). Trả 200 để PayOS ngừng retry, nhưng không cộng tiền.
        return NextResponse.json(
          { success: false, message: "Số tiền không khớp yêu cầu nạp — đã bỏ qua" },
          { status: 200 }
        );
      }
      logger.warn("payos_webhook_intent_not_found", { webhookId, orderCode });
      return NextResponse.json(
        { success: false, message: "Không tìm thấy PaymentIntent phù hợp" },
        { status: 200 }
      );
    }

    logger.info("payos_deposit_success", { webhookId, amount });
    return NextResponse.json({ success: true, message: "Cộng tiền thành công" });
  } catch (error) {
    logger.error("payos_webhook_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Có lỗi xảy ra trên hệ thống xử lý webhook" },
      { status: 500 }
    );
  }
}
