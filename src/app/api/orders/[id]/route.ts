import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";

export async function GET(
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
    if (!payload) {
      return NextResponse.json({ error: "Hết hạn phiên đăng nhập" }, { status: 401 });
    }

    const { id } = await params;

    const order = await db.order.findFirst({
      where: {
        id,
        // Bảo vệ: Khách hàng chỉ xem được đơn của mình, ADMIN xem được hết
        userId: payload.role === "ADMIN" ? undefined : payload.userId,
      },
      include: {
        service: {
          select: { name: true },
        },
        priceOption: {
          select: { name: true },
        },
        statusLogs: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Đơn hàng không tồn tại hoặc không có quyền truy cập" },
        { status: 404 }
      );
    }

    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      serviceName: order.service.name,
      priceOptionName: order.priceOption.name,
      amount: order.amount,
      status: order.status,
      uid: order.uid,
      server: order.server,
      note: order.note || "",
      createdAt: order.createdAt.toISOString(),
      statusLogs: order.statusLogs.map((l) => ({
        id: l.id,
        status: l.status,
        note: l.note || "",
        createdAt: l.createdAt.toISOString(),
        createdBy: l.createdBy,
      })),
    };

    return NextResponse.json({
      success: true,
      order: formattedOrder,
    });
  } catch (error) {
    console.error("Lỗi API chi tiết đơn hàng:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ chi tiết đơn" },
      { status: 500 }
    );
  }
}
