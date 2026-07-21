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

    const logs = await db.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
    });

    const formattedLogs = logs.map((l) => ({
      id: l.id,
      adminName: l.adminName,
      action: l.action,
      target: l.target,
      details: l.details,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
    });
  } catch (error) {
    console.error("Lỗi lấy nhật ký bảo mật Admin:", error);
    return NextResponse.json(
      { error: "Lỗi kết nối lịch sử an toàn" },
      { status: 500 }
    );
  }
}
