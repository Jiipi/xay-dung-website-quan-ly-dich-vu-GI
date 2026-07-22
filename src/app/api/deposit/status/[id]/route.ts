import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";
import { payOS } from "@/lib/payos";
import { getBalanceInTx } from "@/modules/wallet/balance";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để thực hiện thao tác này" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Phiên đăng nhập hết hạn" },
        { status: 401 }
      );
    }

    const paymentIntent = await db.paymentIntent.findFirst({
      where: {
        id,
        userId: payload.userId,
      },
    });

    if (!paymentIntent) {
      return NextResponse.json(
        { error: "Không tìm thấy yêu cầu nạp tiền" },
        { status: 404 }
      );
    }

    // Nếu đang pending và có kết nối PayOS -> Thử check status trên PayOS SDK phòng trường hợp webhook chưa tới
    if (
      paymentIntent.status === "pending" &&
      process.env.PAYOS_CLIENT_ID &&
      process.env.PAYOS_CLIENT_ID !== "YOUR_PAYOS_CLIENT_ID"
    ) {
      try {
        const match = paymentIntent.content.match(/\d+/);
        if (match) {
          const orderCode = Number(match[0]);
          const payosOrder = await payOS.paymentRequests.get(orderCode);
          if (payosOrder && payosOrder.status === "PAID") {
            await db.$transaction(async (tx) => {
              await tx.paymentIntent.update({
                where: { id: paymentIntent.id },
                data: { status: "completed" },
              });

              const previousBalance = await getBalanceInTx(tx, payload.userId);

              await tx.walletTransaction.create({
                data: {
                  userId: payload.userId,
                  type: "deposit",
                  amount: paymentIntent.amount,
                  balance: previousBalance + paymentIntent.amount,
                  description: `Nạp tiền qua PayOS (Đơn #${orderCode})`,
                  status: "success",
                },
              });

              paymentIntent.status = "completed";
            });
          }
        }
      } catch (payosErr) {
        console.warn("[deposit/status] PayOS get status error:", payosErr);
      }
    }

    return NextResponse.json({
      success: true,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
    });
  } catch (error) {
    console.error("Lỗi GET /api/deposit/status/[id]:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi kiểm tra trạng thái" },
      { status: 500 }
    );
  }
}
