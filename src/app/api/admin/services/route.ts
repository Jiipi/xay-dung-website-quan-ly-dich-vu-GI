import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";

// GET: Lấy danh sách tất cả dịch vụ cho Admin
export async function GET() {
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

    const services = await db.service.findMany({
      include: {
        priceOptions: true,
        category: true,
      },
      orderBy: { name: "asc" },
    });

    const formattedServices = services.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      description: s.description || "",
      imageUrl: s.imageUrl || "",
      isActive: s.isActive,
      priceOptions: s.priceOptions.map((o) => ({
        id: o.id,
        name: o.name,
        price: o.price,
        originalPrice: o.originalPrice || 0,
        isActive: true,
      })),
    }));

    return NextResponse.json({
      success: true,
      services: formattedServices,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách dịch vụ Admin:", error);
    return NextResponse.json(
      { error: "Lỗi kết nối dữ liệu dịch vụ" },
      { status: 500 }
    );
  }
}

// POST: Tạo dịch vụ mới kèm các gói cước
export async function POST(request: Request) {
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

    const { name, category, description, imageUrl, priceOptions } = await request.json();

    if (!name || !category) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên dịch vụ và danh mục" },
        { status: 400 }
      );
    }

    const result = await db.service.create({
      data: {
        name,
        category,
        description,
        imageUrl,
        isActive: true,
        priceOptions: {
          create: (priceOptions || []).map((o: { name: string; price: number; originalPrice?: number }) => ({
            name: o.name,
            price: Number(o.price),
            originalPrice: Number(o.originalPrice || 0),
          })),
        },
      },
      include: {
        priceOptions: true,
      },
    });

    return NextResponse.json({
      success: true,
      service: result,
    });
  } catch (error) {
    console.error("Lỗi tạo dịch vụ mới:", error);
    return NextResponse.json(
      { error: "Không thể tạo dịch vụ mới" },
      { status: 500 }
    );
  }
}

// PATCH: Cập nhật thông tin hoặc Khóa / Mở khóa dịch vụ
export async function PATCH(request: Request) {
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

    const body = await request.json();
    const { id, isActive, name, category, description, imageUrl } = body;

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID dịch vụ" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (typeof isActive === "boolean") updateData.isActive = isActive;
    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (typeof description === "string") updateData.description = description;
    if (typeof imageUrl === "string") updateData.imageUrl = imageUrl;

    const updatedService = await db.service.update({
      where: { id },
      data: updateData,
      include: { priceOptions: true },
    });

    // Audit log
    if (admin) {
      await db.adminAuditLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.name,
          action: typeof isActive === "boolean" ? (isActive ? "UNLOCK_SERVICE" : "LOCK_SERVICE") : "UPDATE_SERVICE",
          target: updatedService.name,
          details: `Dịch vụ [${updatedService.name}] đã được ${typeof isActive === "boolean" ? (isActive ? "mở khóa" : "khóa tạm thời") : "cập nhật thông tin"}`,
          ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Đã ${updatedService.isActive ? "mở khóa" : "khóa"} dịch vụ ${updatedService.name}!`,
      service: updatedService,
    });
  } catch (error) {
    console.error("Lỗi cập nhật dịch vụ:", error);
    return NextResponse.json(
      { error: "Không thể cập nhật dịch vụ" },
      { status: 500 }
    );
  }
}
