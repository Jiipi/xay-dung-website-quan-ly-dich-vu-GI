import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [totalOrders, completedOrdersCount, totalCustomers, reviewAgg] = await Promise.all([
      db.order.count().catch(() => 0),
      db.order.count({ where: { status: { in: ["completed", "COMPLETED"] } } }).catch(() => 0),
      db.user.count({ where: { role: "CUSTOMER" } }).catch(() => 0),
      db.review.aggregate({ _avg: { rating: true }, _count: true }).catch(() => ({ _avg: { rating: null }, _count: 0 })),
    ]);

    const ordersCount = completedOrdersCount > 0 ? completedOrdersCount : totalOrders;
    const avgRating = reviewAgg._avg.rating ? Math.round(reviewAgg._avg.rating * 10) / 10 : 5.0;
    const satisfactionRate = reviewAgg._count > 0 ? Math.min(100, Math.round((avgRating / 5) * 100)) : 99;

    return NextResponse.json({
      success: true,
      stats: {
        completedOrders: ordersCount,
        totalCustomers,
        rating: avgRating,
        satisfactionRate,
      },
    });
  } catch (error) {
    console.error("Lỗi GET public stats:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi tải thống kê hệ thống" },
      { status: 500 }
    );
  }
}
