import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Từ chối truy cập" }, { status: 403 });
    }

    const { id } = await params;

    const order = await db.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true },
        },
        service: {
          select: { name: true },
        },
        priceOption: {
          select: { name: true },
        },
        statusLogs: {
          orderBy: { createdAt: "desc" },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
        credentials: {
          select: {
            id: true,
            viewCount: true,
            expiresAt: true,
            isUsed: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    const formatted = {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      userName: order.user.name,
      userEmail: order.user.email,
      serviceId: order.serviceId,
      serviceName: order.service.name,
      priceOptionName: order.priceOption?.name || "Gói tiêu chuẩn",
      amount: order.amount,
      status: order.status,
      uid: order.uid,
      server: order.server,
      note: order.note,
      resultImages: order.resultImages,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      hasCredentials: !!order.credentials,
      credentialsMeta: order.credentials
        ? {
            viewCount: order.credentials.viewCount,
            expiresAt: order.credentials.expiresAt.toISOString(),
            isUsed: order.credentials.isUsed,
          }
        : null,
      statusLogs: order.statusLogs.map((l) => ({
        id: l.id,
        status: l.status,
        note: l.note,
        createdAt: l.createdAt.toISOString(),
        createdBy: l.createdBy,
      })),
      messages: order.messages.map((m) => ({
        id: m.id,
        message: m.message,
        senderRole: m.senderRole,
        senderName: m.senderName,
        createdAt: m.createdAt.toISOString(),
        attachments: m.attachments,
      })),
    };

    return NextResponse.json({
      success: true,
      order: formatted,
    });
  } catch (error) {
    console.error("Lỗi API chi tiết đơn hàng Admin:", error);
    return NextResponse.json(
      { error: "Lỗi lấy dữ liệu chi tiết đơn hàng" },
      { status: 500 }
    );
  }
}

// PATCH: Cập nhật trạng thái đơn hàng (Duyệt/Nhận cày, Hoàn thành, Hủy đơn)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Từ chối truy cập" }, { status: 403 });
    }

    const admin = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true },
    });

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Thiếu trạng thái cập nhật" }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id },
      select: { id: true, orderNumber: true, status: true, userId: true, amount: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Đơn hàng không tồn tại" }, { status: 404 });
    }

    const updatedOrder = await db.order.update({
      where: { id },
      data: { status },
    });

    // Xử lý biến động ví khi hoàn thành hoặc hủy đơn
    if (status === "completed" || status === "COMPLETED") {
      // Chuyển giao dịch tạm giữ (hold) sang thanh toán chính thức (charge)
      await db.walletTransaction.updateMany({
        where: { orderId: id, type: "hold" },
        data: {
          type: "charge",
          description: `Thanh toán cho đơn hàng ${order.orderNumber} (Đã hoàn thành)`,
        },
      });
    } else if (status === "cancelled" || status === "CANCELLED" || status === "refunded") {
      // Nếu hủy đơn, kiểm tra xem có giao dịch tạm giữ/thanh toán nào để hoàn tiền không
      const existingTx = await db.walletTransaction.findFirst({
        where: { orderId: id, type: { in: ["hold", "charge"] } },
      });

      if (existingTx && order.amount > 0) {
        const agg = await db.walletTransaction.aggregate({
          where: { userId: order.userId, status: "success" },
          _sum: { amount: true },
        });
        const currentBal = agg._sum.amount ?? 0;
        const newBal = currentBal + order.amount;

        // Tạo giao dịch Hoàn tiền trong ví
        await db.walletTransaction.create({
          data: {
            userId: order.userId,
            orderId: id,
            type: "refund",
            amount: order.amount,
            balance: newBal,
            description: `Hoàn tiền tự động cho đơn hàng ${order.orderNumber} (Đã hủy đơn)`,
            status: "success",
          },
        });

        // Đánh dấu giao dịch tạm giữ cũ đã được hoàn trả
        await db.walletTransaction.updateMany({
          where: { orderId: id, type: "hold" },
          data: {
            type: "refunded",
            description: `Hoàn trả tạm giữ tiền cho đơn hàng ${order.orderNumber}`,
          },
        });
      }
    }

    // Thêm lịch sử thay đổi trạng thái
    await db.orderStatusLog.create({
      data: {
        orderId: id,
        status: status,
        note: `Admin ${admin?.name || "Hệ thống"} đã cập nhật trạng thái đơn sang [${status}]`,
        createdBy: admin?.name || "ADMIN",
      },
    });

    // Thêm Audit Log
    if (admin) {
      await db.adminAuditLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name,
          action: "UPDATE_ORDER_STATUS",
          target: order.orderNumber,
          details: `Đã đổi trạng thái đơn [${order.orderNumber}] từ [${order.status}] sang [${status}]`,
          ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật trạng thái đơn hàng sang ${status}`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái đơn hàng:", error);
    return NextResponse.json(
      { error: "Không thể cập nhật trạng thái đơn hàng" },
      { status: 500 }
    );
  }
}
