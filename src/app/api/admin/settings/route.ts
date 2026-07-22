import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";

const DEFAULT_SETTINGS: Record<string, string> = {
  bankName: "Vietcombank",
  accountNumber: "1023456789",
  accountName: "Genshin77 ADMIN",
  payosClientId: "sandbox_client_id_123456",
  payosApiKey: "sandbox_api_key_789012",
  payosChecksum: "sandbox_checksum_345678",
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Phiên hết hạn" }, { status: 401 });
    }

    const admin = await db.user.findUnique({
      where: { id: payload.userId },
      select: { role: true },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Quyền hạn không hợp lệ" }, { status: 403 });
    }

    const settingsFromDb = await db.systemSetting.findMany();
    const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS };

    settingsFromDb.forEach((item) => {
      settingsMap[item.key] = item.value;
    });

    return NextResponse.json({ success: true, settings: settingsMap });
  } catch (error) {
    console.error("Lỗi lấy cấu hình hệ thống:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Phiên hết hạn" }, { status: 401 });
    }

    const admin = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, role: true },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Quyền hạn không hợp lệ" }, { status: 403 });
    }

    const body = await request.json();
    const { settings } = body as { settings: Record<string, string> };

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Dữ liệu cấu hình không hợp lệ" }, { status: 400 });
    }

    const upsertPromises = Object.entries(settings).map(([key, value]) =>
      db.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    );

    await Promise.all(upsertPromises);

    // Audit log
    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: "UPDATE_SETTINGS",
        target: "SystemSetting",
        details: `Cập nhật cấu hình hệ thống: ${Object.keys(settings).join(", ")}`,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật cấu hình hệ thống vào DB thành công!",
    });
  } catch (error) {
    console.error("Lỗi lưu cấu hình hệ thống:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi lưu cấu hình" }, { status: 500 });
  }
}
