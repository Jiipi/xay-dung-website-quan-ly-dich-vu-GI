import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";
import { payOS } from "@/lib/payos";
import { isRateLimited } from "@/lib/rate-limit";
import { isBlockedCrossSite } from "@/lib/csrf";
import { generateVietQRUrl } from "@/lib/payments/vietqr";

export async function POST(request: Request) {
  try {
    if (isBlockedCrossSite(request)) {
      return NextResponse.json(
        { error: "Yêu cầu bị từ chối (nguồn không hợp lệ)" },
        { status: 403 }
      );
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    
    // Giới hạn 5 lần tạo mã nạp tiền trong 10 phút từ cùng 1 IP
    if (isRateLimited(ip, 5, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Bạn đã tạo quá nhiều yêu cầu nạp tiền. Vui lòng đợi 10 phút." },
        { status: 429 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để thực hiện nạp tiền" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" },
        { status: 401 }
      );
    }

    const { amount } = await request.json();

    if (!amount || amount < 10000) {
      return NextResponse.json(
        { error: "Số tiền nạp tối thiểu là 10.000đ" },
        { status: 400 }
      );
    }

    const userId = payload.userId;

    // Sinh mã thanh toán ngẫu nhiên (Số nguyên dương cho payOS orderCode)
    const orderCode = Number(String(Date.now()).slice(-6) + String(Math.floor(100 + Math.random() * 900)));
    const paymentCode = `NAP-${userId.slice(-4).toUpperCase()}-${orderCode}`;

    // Khởi tạo thông tin ngân hàng thụ hưởng (Từ config của Admin)
    const bankConfig = await db.systemSetting.findFirst({
      where: { key: "bank_config" },
    });

    let bankInfo = {
      bankName: "Vietcombank",
      accountNumber: "1023456789",
      accountName: "Genshin77 ADMIN",
    };

    if (bankConfig) {
      try {
        bankInfo = JSON.parse(bankConfig.value);
      } catch (e) {
        console.error("Lỗi parse cấu hình ngân hàng trong DB:", e);
      }
    }

    const description = `Genshin77 ${orderCode}`;
    const returnUrl = `${process.env.NEXTAUTH_URL}/dashboard/wallet`;
    const cancelUrl = `${process.env.NEXTAUTH_URL}/dashboard/deposit`;

    // Gọi payOS SDK tạo Payment Link (Nếu có cấu hình)
    let paymentLinkData;
    const cleanBankId = bankInfo.bankName ? bankInfo.bankName.toLowerCase().replace(/[^a-z0-9]/g, "") : "vietcombank";
    const vietQRUrl = generateVietQRUrl({
      amount: Number(amount),
      paymentCode: description,
      bankConfig: {
        bankId: cleanBankId,
        accountNo: bankInfo.accountNumber,
        accountName: bankInfo.accountName,
      },
    });

    try {
      if (process.env.PAYOS_CLIENT_ID && process.env.PAYOS_CLIENT_ID !== "YOUR_PAYOS_CLIENT_ID") {
        paymentLinkData = await payOS.paymentRequests.create({
          orderCode,
          amount: Number(amount),
          description: description.slice(0, 25), // payOS giới hạn mô tả 25 ký tự
          returnUrl,
          cancelUrl,
        });
      }
    } catch (payosError) {
      console.warn("payOS chưa cấu hình hoặc báo lỗi, chuyển sang mã VietQR chuẩn:", payosError);
    }

    let finalQrUrl = vietQRUrl;
    if (paymentLinkData?.qrCode) {
      if (paymentLinkData.qrCode.startsWith("http")) {
        finalQrUrl = paymentLinkData.qrCode;
      } else {
        // PayOS trả về chuỗi EMVCo (0002010...) -> Chuyển thành link ảnh QR hiển thị
        finalQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentLinkData.qrCode)}`;
      }
    }

    // Lưu PaymentIntent vào database ở trạng thái pending
    const paymentIntent = await db.paymentIntent.create({
      data: {
        userId,
        amount: Number(amount),
        status: "pending",
        paymentCode,
        qrCodeUrl: finalQrUrl,
        bankName: bankInfo.bankName,
        accountNumber: bankInfo.accountNumber,
        accountName: bankInfo.accountName,
        content: description,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // Hết hạn sau 15 phút
      },
    });

    return NextResponse.json({
      success: true,
      paymentIntent: {
        ...paymentIntent,
        qrCodeUrl: finalQrUrl,
        checkoutUrl: paymentLinkData?.checkoutUrl || null,
      },
    });
  } catch (error) {
    console.error("Lỗi API tạo link nạp tiền:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi khởi tạo thanh toán" },
      { status: 500 }
    );
  }
}
