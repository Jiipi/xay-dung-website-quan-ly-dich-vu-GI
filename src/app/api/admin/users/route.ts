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

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Lấy số dư ví ledger cho từng user
    const usersWithBalance = await Promise.all(
      users.map(async (u) => {
        const txs = await db.walletTransaction.findMany({
          where: { userId: u.id, status: "success" },
          select: { amount: true },
        });
        const balance = txs.reduce((sum, tx) => sum + tx.amount, 0);

        return {
          ...u,
          balance,
          createdAt: u.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({
      success: true,
      users: usersWithBalance,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách khách hàng Admin:", error);
    return NextResponse.json(
      { error: "Lỗi xử lý yêu cầu khách hàng" },
      { status: 500 }
    );
  }
}
