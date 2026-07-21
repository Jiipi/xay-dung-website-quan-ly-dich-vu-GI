import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as bcrypt from "bcryptjs";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập thông tin này" },
        { status: 403 }
      );
    }

    const { orderId, password } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp mã đơn hàng" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Vui lòng nhập lại mật khẩu admin để xác thực" },
        { status: 400 }
      );
    }

    // RE-AUTH (P1-2): xác thực lại mật khẩu admin trước khi lộ thông tin nhạy cảm
    const adminUser = await db.user.findUnique({
      where: { id: payload.userId },
      select: { password: true },
    });
    if (!adminUser) {
      return NextResponse.json({ error: "Tài khoản admin không hợp lệ" }, { status: 401 });
    }
    const passwordValid = await bcrypt.compare(password, adminUser.password);
    if (!passwordValid) {
      // Ghi log lần xác thực thất bại (không lộ credential)
      await db.adminAuditLog.create({
        data: {
          adminId: payload.userId,
          adminName: payload.name || payload.email,
          action: "VIEW_CREDENTIALS_REAUTH_FAILED",
          target: orderId,
          details: "Nhập sai mật khẩu admin khi cố xem mật khẩu game.",
          ipAddress:
            request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1",
        },
      });
      return NextResponse.json(
        { error: "Mật khẩu admin không đúng. Không thể xem mật khẩu game." },
        { status: 401 }
      );
    }

    // Truy vấn đơn hàng và mật khẩu mã hóa
    const credential = await db.orderCredential.findUnique({
      where: { orderId },
      include: {
        order: {
          select: {
            orderNumber: true,
            status: true,
          },
        },
      },
    });

    if (!credential) {
      return NextResponse.json(
        { error: "Không tìm thấy thông tin đăng nhập của đơn hàng này" },
        { status: 404 }
      );
    }

    // 1. Kiểm tra thời hạn hiệu lực của credential
    if (new Date() > credential.expiresAt) {
      return NextResponse.json(
        { error: "Thông tin tài khoản game đã hết hạn lưu trữ và bị vô hiệu hóa" },
        { status: 410 }
      );
    }

    // 2. Ghi nhận và tăng số lần xem
    await db.orderCredential.update({
      where: { orderId },
      data: {
        viewCount: { increment: 1 },
        isUsed: true,
      },
    });

    // 3. Giải mã mật khẩu bằng AES-256-GCM
    const decryptedPassword = decrypt(credential.encryptedPassword);

    // 4. Lấy địa chỉ IP
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    // 5. Ghi nhật ký bảo mật Audit Log
    await db.adminAuditLog.create({
      data: {
        adminId: payload.userId,
        adminName: payload.name || payload.email,
        action: "VIEW_CREDENTIALS",
        target: credential.order.orderNumber,
        details: `Admin đã kích hoạt quyền xem mật khẩu game tạm thời. Số lần xem lũy kế: ${credential.viewCount + 1}`,
        ipAddress,
      },
    });

    return NextResponse.json({
      success: true,
      password: decryptedPassword,
    });
  } catch (error) {
    console.error("Lỗi API giải mã tài khoản game:", error);
    return NextResponse.json(
      { error: "Không thể giải mã dữ liệu mật khẩu" },
      { status: 500 }
    );
  }
}
