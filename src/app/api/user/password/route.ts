import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as bcrypt from "bcryptjs";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";

export async function POST(request: Request) {
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

    const { currentPassword, newPassword, confirmPassword } = await request.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu mới phải có tối thiểu 6 ký tự" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Mật khẩu mới và mật khẩu xác nhận không trùng khớp" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Người dùng không tồn tại" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Mật khẩu hiện tại không chính xác" },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật mật khẩu thành công!",
    });
  } catch (error) {
    console.error("Lỗi đổi mật khẩu:", error);
    return NextResponse.json(
      { error: "Không thể đổi mật khẩu, vui lòng thử lại sau" },
      { status: 500 }
    );
  }
}
