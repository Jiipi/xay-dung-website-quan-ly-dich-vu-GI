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

    const transactions = await db.walletTransaction.findMany({
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedTxs = transactions.map((t) => ({
      id: t.id,
      userId: t.userId,
      userName: t.user.name,
      userEmail: t.user.email,
      type: t.type,
      amount: t.amount,
      balance: t.balance,
      description: t.description,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      transactions: formattedTxs,
    });
  } catch (error) {
    console.error("Lỗi lấy lịch sử giao dịch ví Admin:", error);
    return NextResponse.json(
      { error: "Lỗi kết nối lịch sử ví" },
      { status: 500 }
    );
  }
}
