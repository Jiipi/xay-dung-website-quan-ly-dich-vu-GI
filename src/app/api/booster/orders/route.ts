import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";

import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
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

    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    const whereCondition: Prisma.OrderWhereInput = {
      boosterId: payload.userId,
    };

    if (status) {
      whereCondition.status = status;
    }

    const orders = await db.order.findMany({
      where: whereCondition,
      include: {
        user: { select: { name: true, email: true } },
        service: { select: { name: true } },
        priceOption: { select: { name: true } },
        statusLogs: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const formatted = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      userId: o.userId,
      userName: o.user.name,
      userEmail: o.user.email,
      serviceName: o.service.name,
      priceOptionName: o.priceOption.name,
      amount: o.amount,
      boosterCommission: o.boosterCommission,
      status: o.status,
      uid: o.uid,
      server: o.server,
      note: o.note,
      resultImages: o.resultImages,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }));

    // Tính tổng hoa hồng của booster
    const completedOrders = orders.filter((o) => o.status === "completed");
    const totalEarned = completedOrders.reduce(
      (sum, o) => sum + (o.boosterCommission || o.amount * 0.3),
      0
    );

    return NextResponse.json({
      success: true,
      orders: formatted,
      stats: {
        totalAssigned: orders.length,
        inProgress: orders.filter((o) => o.status === "in_progress").length,
        completed: completedOrders.length,
        totalEarned,
      },
    });
  } catch (error) {
    console.error("Lỗi danh sách đơn hàng Booster:", error);
    return NextResponse.json({ error: "Lỗi kết nối máy chủ" }, { status: 500 });
  }
}
