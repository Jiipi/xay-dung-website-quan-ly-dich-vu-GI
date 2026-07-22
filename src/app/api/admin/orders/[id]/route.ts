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
