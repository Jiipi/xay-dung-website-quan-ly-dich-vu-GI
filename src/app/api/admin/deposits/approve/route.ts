import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";
import { getBalanceInTx } from "@/modules/wallet/balance";
import { notifyDepositCompleted } from "@/lib/notifications/telegram";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Phiên hết hạn" }, { status: 401 });
    }

    // Verify Admin role
    const admin = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, role: true, isActive: true },
    });

    if (!admin || !admin.isActive || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Quyền hạn không hợp lệ" }, { status: 403 });
    }

    const { paymentIntentId } = await request.json();
    if (!paymentIntentId) {
      return NextResponse.json({ error: "Thiếu ID yêu cầu nạp tiền" }, { status: 400 });
    }

    const intent = await db.paymentIntent.findUnique({
      where: { id: paymentIntentId },
      include: { user: true },
    });

    if (!intent) {
      return NextResponse.json({ error: "Lệnh nạp tiền không tồn tại" }, { status: 404 });
    }

    if (intent.status === "completed") {
      return NextResponse.json({ error: "Lệnh nạp tiền này đã hoàn tất rồi" }, { status: 400 });
    }

    // Perform DB Transaction to update intent, add wallet transaction, create notification & audit log
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
          description: `Nạp tiền qua VietQR [Duyệt thủ công Admin] (${intent.content})`,
          status: "success",
        },
      });

      await tx.notification.create({
        data: {
          userId: intent.userId,
          type: "payment",
          title: "Nạp tiền thành công! 🎉",
          content: `Tài khoản của bạn đã được Admin duyệt cộng ${intent.amount.toLocaleString("vi-VN")}đ qua VietQR.`,
          href: "/dashboard/wallet",
        },
      });

      // Audit Log
      await tx.adminAuditLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name,
          action: "APPROVE_DEPOSIT",
          target: intent.paymentCode,
          details: `Duyệt thủ công đơn nạp tiền ${intent.paymentCode} - Số tiền: ${intent.amount.toLocaleString("vi-VN")}đ cho khách hàng ${intent.user.name} (${intent.user.email})`,
          ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
        },
      });

      return { updatedIntent, walletTx, newBalance };
    });

    // Notify Telegram channel (silent fallback)
    try {
      await notifyDepositCompleted({
        userName: intent.user.name,
        userEmail: intent.user.email,
        amount: intent.amount,
        paymentCode: intent.paymentCode,
        newBalance: result.newBalance,
      });
    } catch {
      // Ignore Telegram error if not configured
    }

    return NextResponse.json({
      success: true,
      message: `Đã duyệt thủ công cộng ${intent.amount.toLocaleString("vi-VN")}đ cho khách hàng ${intent.user.name}`,
      newBalance: result.newBalance,
    });
  } catch (error) {
    console.error("Lỗi duyệt nạp tiền thủ công:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi duyệt nạp tiền" }, { status: 500 });
  }
}
