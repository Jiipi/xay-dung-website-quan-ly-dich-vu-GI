import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Hết hạn phiên đăng nhập" }, { status: 401 });
    }

    const { name, avatarUrl } = await request.json();

    const updateData: { name?: string; avatarUrl?: string | null } = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Không có thông tin cần thay đổi" },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: payload.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Lỗi cập nhật hồ sơ khách hàng:", error);
    return NextResponse.json(
      { error: "Lỗi lưu thông tin hồ sơ" },
      { status: 500 }
    );
  }
}
