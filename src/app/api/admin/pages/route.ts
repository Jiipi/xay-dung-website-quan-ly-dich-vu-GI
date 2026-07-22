import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";

const DEFAULT_PAGES_CONTENT: Record<string, string> = {
  terms: `# Điều khoản dịch vụ\n\nCập nhật lần cuối: 01/07/2026\n\n## 1. Giới thiệu\nChào mừng bạn đến với Genshin77. Khi truy cập và sử dụng dịch vụ cày thuê của chúng tôi...`,
  privacy: `# Chính sách bảo mật\n\nCập nhật lần cuối: 01/07/2026\n\n## 1. Dữ liệu thu thập\nChúng tôi cam kết bảo vệ tuyệt đối mật khẩu và thông tin tài khoản game của bạn bằng mã hóa AES-256...`,
  refund: `# Chính sách hoàn tiền\n\nCập nhật lần cuối: 01/07/2026\n\n## 1. Điều kiện hoàn tiền\nBạn được hoàn tiền 100% vào ví nếu đơn hàng chưa có Booster nhận hoặc quá hạn 48h...`,
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageName = searchParams.get("pageName") || "terms";

    const pageInDb = await db.pagesContent.findUnique({
      where: { pageName },
    });

    const content = pageInDb?.content || DEFAULT_PAGES_CONTENT[pageName] || "# Nội dung trang";

    return NextResponse.json({ success: true, pageName, content });
  } catch (error) {
    console.error("Lỗi lấy nội dung trang tĩnh:", error);
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

    const { pageName, content } = await request.json();

    if (!pageName || typeof content !== "string") {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
    }

    const updated = await db.pagesContent.upsert({
      where: { pageName },
      update: { content },
      create: { pageName, content },
    });

    // Audit log
    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: "UPDATE_STATIC_PAGE",
        target: pageName,
        details: `Cập nhật nội dung Markdown trang tĩnh [${pageName}]`,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật nội dung trang ${pageName} thành công!`,
      page: updated,
    });
  } catch (error) {
    console.error("Lỗi cập nhật trang tĩnh:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi cập nhật trang" }, { status: 500 });
  }
}
