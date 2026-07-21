import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signToken } from "@/lib/jwt";
import { sendEmail, generatePasswordResetEmail } from "@/lib/email";
import { z } from "zod";

const requestSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Email không hợp lệ" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user && user.isActive) {
      // Sinh token đặt lại mật khẩu hết hạn sau 15 phút
      const resetToken = await signToken(
        { userId: user.id, email: user.email, role: user.role, type: "password_reset" },
        "15m"
      );

      const host = request.headers.get("host") || "localhost:3000";
      const protocol = host.includes("localhost") ? "http" : "https";
      const resetUrl = `${protocol}://${host}/reset-password?token=${resetToken}`;

      const emailHtml = generatePasswordResetEmail(resetUrl, user.name);
      await sendEmail({
        to: user.email,
        subject: "Genshin77 — Khôi phục Mật Khẩu Tài Khoản",
        html: emailHtml,
      });
    }

    // Luôn trả về 200 thành công để chống Enumeration Attack (dò email)
    return NextResponse.json({
      success: true,
      message: "Nếu email tồn tại trên hệ thống, chúng tôi đã gửi liên kết khôi phục mật khẩu vào hòm thư của bạn.",
    });
  } catch (error) {
    console.error("Lỗi API quên mật khẩu:", error);
    return NextResponse.json(
      { error: "Không thể xử lý yêu cầu quên mật khẩu" },
      { status: 500 }
    );
  }
}
