import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as bcrypt from "bcryptjs";
import { signToken } from "@/lib/jwt";
import { isRateLimited } from "@/lib/rate-limit";
import { isBlockedCrossSite } from "@/lib/csrf";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    if (isBlockedCrossSite(request)) {
      return NextResponse.json(
        { error: "Yêu cầu bị từ chối (nguồn không hợp lệ)" },
        { status: 403 }
      );
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    
    // Giới hạn 3 lần đăng ký tài khoản trong 5 phút từ cùng 1 IP
    if (isRateLimited(ip, 3, 5 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Bạn đã đăng ký quá nhiều tài khoản. Vui lòng thử lại sau 5 phút." },
        { status: 429 }
      );
    }

    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }
    const { name, email, password } = parsed.data;

    // Kiểm tra email tồn tại chưa
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email này đã được đăng ký sử dụng" },
        { status: 400 }
      );
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Tạo người dùng mới
    const newUser = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: passwordHash,
        role: "CUSTOMER",
      },
    });

    // Tự động ký token đăng nhập luôn sau khi đăng ký
    const token = await signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Lỗi đăng ký API:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi tạo tài khoản mới" },
      { status: 500 }
    );
  }
}
