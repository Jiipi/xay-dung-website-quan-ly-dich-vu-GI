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

    const deposits = await db.paymentIntent.findMany({
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedDeposits = deposits.map((d) => ({
      id: d.id,
      userName: d.user.name,
      userEmail: d.user.email,
      amount: d.amount,
      status: d.status,
      paymentCode: d.paymentCode,
      createdAt: d.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      deposits: formattedDeposits,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách nạp tiền Admin:", error);
    return NextResponse.json(
      { error: "Lỗi kết nối dữ liệu nạp tiền" },
      { status: 500 }
    );
  }
}
