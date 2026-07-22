import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
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

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderNumber: true,
            amount: true,
            status: true,
            createdAt: true,
            service: { select: { name: true } },
          },
        },
        transactions: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            type: true,
            amount: true,
            balance: true,
            description: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });
    }

    // Calculate current wallet balance from latest wallet transaction or sum
    const lastTx = user.transactions[0];
    const balance = lastTx ? lastTx.balance : 0;

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        balance,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết người dùng:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
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
    const { role, isActive } = body;

    const dataToUpdate: Record<string, unknown> = {};
    if (typeof isActive === "boolean") dataToUpdate.isActive = isActive;
    if (role && ["CUSTOMER", "BOOSTER", "ADMIN"].includes(role)) dataToUpdate.role = role;

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    // Audit log
    await db.adminAuditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name,
        action: "UPDATE_USER",
        target: updatedUser.email,
        details: `Cập nhật người dùng ${updatedUser.name} (${updatedUser.email}): ${JSON.stringify(dataToUpdate)}`,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật thông tin tài khoản ${updatedUser.name}!`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Lỗi cập nhật thông tin người dùng:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi cập nhật người dùng" }, { status: 500 });
  }
}
