import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";
import { isBlockedCrossSite } from "@/lib/csrf";
import type { TokenPayload } from "@/lib/jwt";

/**
 * Xác thực token + kiểm quyền truy cập đơn hàng:
 * - Khách: chỉ đơn của mình. Admin: mọi đơn.
 */
async function authorizeOrder(
  orderId: string
): Promise<
  | { ok: true; payload: TokenPayload }
  | { ok: false; error: string; status: number }
> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return { ok: false, error: "Chưa đăng nhập", status: 401 };

  const payload = await verifyToken(token);
  if (!payload) return { ok: false, error: "Phiên đăng nhập không hợp lệ", status: 401 };

  const order = await db.order.findFirst({
    where: {
      id: orderId,
      userId: payload.role === "ADMIN" ? undefined : payload.userId,
    },
    select: { id: true },
  });
  if (!order) {
    return {
      ok: false,
      error: "Đơn hàng không tồn tại hoặc bạn không có quyền truy cập",
      status: 404,
    };
  }
  return { ok: true, payload };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authorizeOrder(id);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const messages = await db.orderMessage.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      messages: messages.map((m) => ({
        id: m.id,
        message: m.message,
        senderRole: m.senderRole,
        senderName: m.senderName,
        createdAt: m.createdAt.toISOString(),
        attachments: m.attachments,
      })),
    });
  } catch (error) {
    console.error("Lỗi lấy tin nhắn đơn hàng:", error);
    return NextResponse.json({ error: "Lỗi máy chủ khi lấy tin nhắn" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (isBlockedCrossSite(request)) {
      return NextResponse.json(
        { error: "Yêu cầu bị từ chối (nguồn không hợp lệ)" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const auth = await authorizeOrder(id);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json().catch(() => ({}));
    const content = typeof body?.message === "string" ? body.message.trim() : "";
    if (!content) {
      return NextResponse.json({ error: "Nội dung tin nhắn không được để trống" }, { status: 400 });
    }
    if (content.length > 2000) {
      return NextResponse.json({ error: "Tin nhắn quá dài (tối đa 2000 ký tự)" }, { status: 400 });
    }

    const created = await db.orderMessage.create({
      data: {
        orderId: id,
        message: content,
        senderRole: auth.payload.role,
        senderName: auth.payload.name || auth.payload.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: {
        id: created.id,
        message: created.message,
        senderRole: created.senderRole,
        senderName: created.senderName,
        createdAt: created.createdAt.toISOString(),
        attachments: created.attachments,
      },
    });
  } catch (error) {
    console.error("Lỗi gửi tin nhắn đơn hàng:", error);
    return NextResponse.json({ error: "Lỗi máy chủ khi gửi tin nhắn" }, { status: 500 });
  }
}
