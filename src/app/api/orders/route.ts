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

    const orders = await db.order.findMany({
      where: { userId: payload.userId },
      include: {
        service: {
          select: { name: true },
        },
        priceOption: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map dữ liệu để tương thích UI cũ
    const formattedOrders = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      serviceName: o.service.name,
      priceOptionName: o.priceOption.name,
      amount: o.amount,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách đơn hàng:", error);
    return NextResponse.json(
      { error: "Lỗi xử lý yêu cầu" },
      { status: 500 }
    );
  }
}
