import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as bcrypt from "bcryptjs";
import { signToken } from "@/lib/jwt";
import { isRateLimited } from "@/lib/rate-limit";
import { isBlockedCrossSite } from "@/lib/csrf";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    if (isBlockedCrossSite(request)) {
      return NextResponse.json(
        { error: "Yêu cầu bị từ chối (nguồn không hợp lệ)" },
        { status: 403 }
      );
    }

    // Lấy địa chỉ IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    
    // Giới hạn 5 lần đăng nhập thử trong 1 phút
    if (isRateLimited(ip, 5, 60 * 1000)) {
      return NextResponse.json(
        { error: "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng đợi 1 phút." },
        { status: 429 }
      );
    }

    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }
    const { email, password } = parsed.data;

    // Tìm người dùng trong database
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Tài khoản không tồn tại hoặc đã bị khóa" },
        { status: 401 }
      );
    }

    // So sánh mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Email hoặc mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    // Tạo token JWT
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Thiết lập cookie HttpOnly
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 ngày tính bằng giây
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Lỗi đăng nhập API:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra trên hệ thống máy chủ" },
      { status: 500 }
    );
  }
}
