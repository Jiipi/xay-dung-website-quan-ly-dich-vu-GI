import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const services = await db.service.findMany({
      where: { isActive: true },
      include: {
        priceOptions: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      services,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Lỗi lấy danh sách dịch vụ:", error);
    return NextResponse.json(
      { error: "Lỗi kết nối máy chủ", details: message },
      { status: 500 }
    );
  }
}
