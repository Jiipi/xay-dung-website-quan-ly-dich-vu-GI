import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Chưa đăng nhập hệ thống" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" },
        { status: 401 }
      );
    }

    // Truy vấn thông tin tài khoản thật từ Database
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Tài khoản không tồn tại hoặc đã bị khóa" },
        { status: 401 }
      );
    }

    // Tính số dư động từ sổ cái bằng aggregate _sum (không tải toàn bộ giao dịch — P2-5)
    const agg = await db.walletTransaction.aggregate({
      where: { userId: user.id, status: "success" },
      _sum: { amount: true },
    });
    const balance = agg._sum.amount ?? 0;

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        balance,
      },
    });
  } catch (error) {
    console.error("Lỗi API auth/me:", error);
    return NextResponse.json(
      { error: "Lỗi xử lý phiên đăng nhập" },
      { status: 500 }
    );
  }
}
