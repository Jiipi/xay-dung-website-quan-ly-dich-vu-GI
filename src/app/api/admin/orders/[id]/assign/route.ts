import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";

export async function POST(
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
    const body = await request.json();
    const { boosterId, commission } = body;

    if (!boosterId) {
      return NextResponse.json({ error: "Vui lòng chọn Booster" }, { status: 400 });
    }

    // Kiểm tra Booster có tồn tại không
    const booster = await db.user.findFirst({
      where: { id: boosterId, role: { in: ["BOOSTER", "ADMIN"] } },
    });

    if (!booster) {
      return NextResponse.json({ error: "Booster không tồn tại" }, { status: 404 });
    }

    const updatedOrder = await db.order.update({
      where: { id },
      data: {
        boosterId,
        boosterCommission: commission != null ? Number(commission) : null,
        statusLogs: {
          create: {
            status: "in_progress",
            note: `Admin đã gán đơn cho Booster ${booster.name} (Hoa hồng: ${commission ? commission.toLocaleString() + "đ" : "Mặc định"})`,
            createdBy: payload.name || "Admin",
          },
        },
      },
      include: {
        booster: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã gán đơn thành công cho Booster ${booster.name}`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Lỗi gán Booster cho đơn hàng:", error);
    return NextResponse.json({ error: "Không thể gán Booster" }, { status: 500 });
  }
}
