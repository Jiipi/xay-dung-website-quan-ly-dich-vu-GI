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

    const transactions = await db.walletTransaction.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: "desc" },
    });

    const formattedTxs = transactions.map((t) => ({
      id: t.id,
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
    console.error("Lỗi lấy giao dịch ví của khách hàng:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống tải lịch sử ví" },
      { status: 500 }
    );
  }
}
