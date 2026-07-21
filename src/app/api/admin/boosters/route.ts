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

    const boosters = await db.user.findMany({
      where: { role: { in: ["BOOSTER", "ADMIN"] }, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      boosters: boosters.map((b) => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Lỗi danh sách Booster:", error);
    return NextResponse.json({ error: "Lỗi kết nối máy chủ" }, { status: 500 });
  }
}
