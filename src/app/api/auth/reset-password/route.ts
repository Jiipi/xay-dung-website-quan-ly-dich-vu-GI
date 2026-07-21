import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import * as bcrypt from "bcryptjs";
import { z } from "zod";

const resetSchema = z.object({
  token: z.string().min(1, "Token không hợp lệ"),
  newPassword: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }

    const { token, newPassword } = parsed.data;
    const payload = await verifyToken(token);

    if (!payload || payload.type !== "password_reset" || !payload.userId) {
      return NextResponse.json(
        { error: "Liên kết khôi phục mật khẩu không hợp lệ hoặc đã hết hạn (quá 15 phút)" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: payload.userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.",
    });
  } catch (error) {
    console.error("Lỗi đặt lại mật khẩu:", error);
    return NextResponse.json(
      { error: "Lỗi kết nối máy chủ khi đổi mật khẩu" },
      { status: 500 }
    );
  }
}
