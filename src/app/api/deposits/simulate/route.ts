import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";
import { getBalanceInTx } from "@/modules/wallet/balance";
import { notifyDepositCompleted } from "@/lib/notifications/telegram";

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Tính năng giả lập bị khóa ở môi trường Production" },
        { status: 403 }
      );
    }
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Phiên hết hạn" }, { status: 401 });
    }

    const { paymentIntentId } = await request.json();
    if (!paymentIntentId) {
      return NextResponse.json({ error: "Thiếu ID lệnh nạp tiền" }, { status: 400 });
    }

    const intent = await db.paymentIntent.findUnique({
      where: { id: paymentIntentId },
      include: { user: true },
    });

    if (!intent || intent.userId !== payload.userId) {
      return NextResponse.json({ error: "Lệnh nạp tiền không tồn tại hoặc không thuộc quyền sở hữu" }, { status: 404 });
    }

    if (intent.status === "completed") {
      return NextResponse.json({ error: "Lệnh nạp tiền này đã được thanh toán rồi" }, { status: 400 });
    }

    // Process instant simulation
    const result = await db.$transaction(async (tx) => {
      const updatedIntent = await tx.paymentIntent.update({
        where: { id: intent.id },
        data: { status: "completed" },
      });

      const previousBalance = await getBalanceInTx(tx, intent.userId);
      const newBalance = previousBalance + intent.amount;

      const walletTx = await tx.walletTransaction.create({
        data: {
          userId: intent.userId,
          type: "deposit",
          amount: intent.amount,
          balance: newBalance,
          description: `Nạp tiền tự động [Giả lập Dev Test] (${intent.content})`,
          status: "success",
        },
      });

      await tx.notification.create({
        data: {
          userId: intent.userId,
          type: "payment",
          title: "Nạp tiền thành công! 🎉",
          content: `Tài khoản của bạn đã được cộng ${intent.amount.toLocaleString("vi-VN")}đ qua VietQR.`,
          href: "/dashboard/wallet",
        },
      });

      return { updatedIntent, walletTx, newBalance };
    });

    // Notify Telegram
    await notifyDepositCompleted({
      userName: intent.user.name,
      userEmail: intent.user.email,
      amount: intent.amount,
      paymentCode: intent.paymentCode,
      newBalance: result.newBalance,
    });

    return NextResponse.json({
      success: true,
      message: "Giả lập thanh toán ngân hàng tự động thành công!",
      newBalance: result.newBalance,
    });
  } catch (error) {
    console.error("Lỗi giả lập nạp tiền:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
