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
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Từ chối truy cập" }, { status: 403 });
    }

    const orders = await db.order.findMany({
      include: {
        user: {
          select: { name: true, email: true },
        },
        service: {
          select: { name: true },
        },
        priceOption: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedOrders = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.user.name,
      customerEmail: o.user.email,
      serviceName: o.service.name,
      priceOptionName: o.priceOption.name,
      amount: o.amount,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error("Lỗi API lấy đơn hàng Admin:", error);
    return NextResponse.json(
      { error: "Lỗi lấy dữ liệu đơn hàng" },
      { status: 500 }
    );
  }
}
