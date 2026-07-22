import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ" }, { status: 401 });
    }

    const transactions = await db.walletTransaction.findMany({
      where: { userId: payload.userId },
      include: {
        order: {
          select: { status: true, orderNumber: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedTxs = transactions.map((t) => {
      const isCompletedOrder =
        t.order && (t.order.status === "completed" || t.order.status === "COMPLETED");
      const isCancelledOrder =
        t.order && (t.order.status === "cancelled" || t.order.status === "CANCELLED");

      let displayType = t.type;
      let displayDesc = t.description;

      if (displayType === "hold" && isCompletedOrder) {
        displayType = "charge";
        displayDesc = `Thanh toán cho đơn hàng ${t.order?.orderNumber} (Đã hoàn thành)`;
      } else if (displayType === "hold" && isCancelledOrder) {
        displayType = "refund";
        displayDesc = `Hoàn trả tạm giữ cho đơn hàng ${t.order?.orderNumber} (Đã hủy)`;
      }

      return {
        id: t.id,
        type: displayType,
        amount: t.amount,
        balance: t.balance,
        description: displayDesc,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      transactions: formattedTxs,
    });
  } catch (error) {
    console.error("Lỗi lấy giao dịch ví của khách hàng:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống tải lịch sử ví" },
      { status: 500 }
    );
  }
}
