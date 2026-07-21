import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBalanceInTx } from "@/modules/wallet/balance";
import { notifyDepositCompleted } from "@/lib/notifications/telegram";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Redact payload để tránh log dữ liệu ngân hàng nhạy cảm ra Sentry
    logger.info("bank_webhook_received", {
      hasContent: Boolean(body.content ?? body.description),
      amount: Number(body.amount ?? body.transferAmount ?? 0),
    });

    // Support standard webhook formats (Casso, SeABank, MBBank, VietQR Webhook, PayOS)
    const content = body.content || body.description || body.data?.description || body.data?.orderCode || "";
    const amount = Number(body.amount || body.transferAmount || body.data?.amount || 0);

    if (!content || amount <= 0) {
      return NextResponse.json({ error: "Payload không hợp lệ" }, { status: 400 });
    }

    // Search pending payment intent matching the transfer content code
    const pendingIntents = await db.paymentIntent.findMany({
      where: { status: "pending" },
    });

    const matchingIntent = pendingIntents.find(
      (intent) =>
        content.toLowerCase().includes(intent.content.toLowerCase()) ||
        content.toLowerCase().includes(intent.paymentCode.toLowerCase())
    );

    if (!matchingIntent) {
      return NextResponse.json(
        { message: "Không tìm thấy lệnh nạp tiền khớp với nội dung chuyển khoản" },
        { status: 404 }
      );
    }

    // Process instant deposit transaction atomically
    const result = await db.$transaction(async (tx) => {
      // 1. Update PaymentIntent to completed
      const updatedIntent = await tx.paymentIntent.update({
        where: { id: matchingIntent.id },
        data: { status: "completed" },
        include: { user: true },
      });

      // 2. Add deposit to WalletTransaction ledger
      const previousBalance = await getBalanceInTx(tx, matchingIntent.userId);
      const newBalance = previousBalance + amount;

      const walletTx = await tx.walletTransaction.create({
        data: {
          userId: matchingIntent.userId,
          type: "deposit",
          amount: amount,
          balance: newBalance,
          description: `Nạp tiền tự động qua Ngân hàng (${matchingIntent.content})`,
          status: "success",
        },
      });

      // 3. Create Notification for user
      await tx.notification.create({
        data: {
          userId: matchingIntent.userId,
          type: "payment",
          title: "Nạp tiền thành công! 🎉",
          content: `Tài khoản của bạn đã được cộng ${amount.toLocaleString("vi-VN")}đ qua chuyển khoản tự động.`,
          href: "/dashboard/wallet",
        },
      });

      return { updatedIntent, walletTx, newBalance };
    });

    // Send Telegram Notification to Admin/Booster Group
    await notifyDepositCompleted({
      userName: result.updatedIntent.user.name,
      userEmail: result.updatedIntent.user.email,
      amount: amount,
      paymentCode: matchingIntent.paymentCode,
      newBalance: result.newBalance,
    });

    return NextResponse.json({
      success: true,
      message: "Cộng tiền tự động thành công!",
      intentId: matchingIntent.id,
    });
  } catch (error) {
    logger.error("bank_webhook_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Lỗi hệ thống khi xử lý thanh toán tự động" },
      { status: 500 }
    );
  }
}
