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
      return NextResponse.json({ error: "Quyền truy cập bị từ chối" }, { status: 403 });
    }

    // 1. Tính tổng doanh thu thực tế (Tổng giá trị các giao dịch ví charge thành công, lấy giá trị tuyệt đối)
    const chargeTxs = await db.walletTransaction.findMany({
      where: {
        type: "charge",
        status: "success",
      },
      select: { amount: true },
    });
    const totalRevenue = Math.abs(chargeTxs.reduce((sum, tx) => sum + tx.amount, 0));

    // 2. Thống kê đơn hàng
    const pendingOrders = await db.order.count({
      where: { status: "waiting_admin_accept" },
    });

    const activeOrders = await db.order.count({
      where: { status: "in_progress" },
    });

    const totalOrders = await db.order.count();

    // 3. Thống kê khách hàng
    const totalUsers = await db.user.count({
      where: { role: "CUSTOMER" },
    });

    // 4. Lấy danh sách doanh thu gần đây (đối soát ví)
    const recentDeposits = await db.walletTransaction.findMany({
      where: { type: "deposit", status: "success" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue,
        pendingOrders,
        activeOrders,
        totalOrders,
        totalUsers,
        recentDeposits: recentDeposits.map((d) => ({
          id: d.id,
          userName: d.user.name,
          userEmail: d.user.email,
          amount: d.amount,
          createdAt: d.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("Lỗi API lấy thống kê Admin:", error);
    return NextResponse.json(
      { error: "Lỗi tổng hợp thống kê" },
      { status: 500 }
    );
  }
}
