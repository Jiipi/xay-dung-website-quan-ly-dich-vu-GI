import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { notifyOrderClaimed } from "@/lib/notifications/telegram";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || (payload.role !== "BOOSTER" && payload.role !== "ADMIN")) {
      return NextResponse.json({ error: "Từ chối truy cập" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, note, resultImages } = body;

    const order = await db.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: "Đơn hàng không tồn tại" }, { status: 404 });
    }

    if (payload.role !== "ADMIN" && order.boosterId !== payload.userId) {
      return NextResponse.json(
        { error: "Bạn không có quyền cập nhật đơn hàng này" },
        { status: 403 }
      );
    }

    const updateData: Prisma.OrderUpdateInput = {};
    if (status) updateData.status = status;
    if (resultImages && Array.isArray(resultImages)) {
      updateData.resultImages = resultImages;
    }

    const updatedOrder = await db.order.update({
      where: { id },
      data: {
        ...updateData,
        statusLogs: status
          ? {
              create: {
                status,
                note: note || `Booster ${payload.name} cập nhật trạng thái`,
                createdBy: payload.name || "Booster",
              },
            }
          : undefined,
      },
    });

    // Nếu chuyển sang completed, tự động xóa credential mật khẩu game (bảo mật)
    if (status === "completed") {
      await db.orderCredential.deleteMany({
        where: { orderId: id },
      });
    }

    // Trigger Telegram notification
    try {
      if (status === "in_progress" || status === "completed") {
        const fullOrderInfo = await db.order.findUnique({
          where: { id },
          include: { service: true, booster: true },
        });
        if (fullOrderInfo && fullOrderInfo.service) {
          await notifyOrderClaimed({
            orderNumber: fullOrderInfo.orderNumber,
            boosterName: payload.name || "Booster",
            serviceName: fullOrderInfo.service.name,
          });
        }
      }
    } catch (notifyErr) {
      console.warn("Không thể gửi thông báo Telegram Booster:", notifyErr);
    }

    return NextResponse.json({
      success: true,
      message: "Cập nhật tiến độ đơn hàng thành công",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Lỗi cập nhật tiến độ Booster:", error);
    return NextResponse.json({ error: "Lỗi kết nối máy chủ" }, { status: 500 });
  }
}
