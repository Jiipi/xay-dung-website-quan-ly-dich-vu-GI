"use server";

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { encrypt } from "@/lib/encryption";
import { getBalanceInTx } from "@/modules/wallet/balance";
import { notifyNewOrder } from "@/lib/notifications/telegram";

/**
 * Chạy transaction ở mức Serializable và RETRY khi gặp xung đột ghi/serialization (Prisma P2034).
 * Mục đích: chống DOUBLE-SPEND khi khách tạo nhiều đơn đồng thời với số dư chỉ đủ 1 đơn.
 */
async function runSerializableWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (
        attempt < maxRetries &&
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2034"
      ) {
        continue; // xung đột serialization -> thử lại
      }
      throw e;
    }
  }
}

import { validateCoupon } from "@/modules/promotions/service";

interface CreateOrderParams {
  serviceId: string;
  priceOptionId: string;
  uid: string;
  server: string;
  note?: string;
  gameEmail: string;
  gamePasswordPlain: string;
  couponCode?: string;
}

export async function createOrderAction(params: CreateOrderParams) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return { error: "Bạn cần đăng nhập để đặt đơn hàng" };
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "CUSTOMER") {
      return { error: "Phiên đăng nhập không hợp lệ" };
    }

    const userId = payload.userId;

    // Lấy thông tin gói dịch vụ & cước phí
    const service = await db.service.findUnique({
      where: { id: params.serviceId },
      include: {
        priceOptions: {
          where: { id: params.priceOptionId },
        },
      },
    });

    if (!service || service.priceOptions.length === 0) {
      return { error: "Gói dịch vụ hoặc tùy chọn giá không tồn tại" };
    }

    const priceOption = service.priceOptions[0];
    const originalOrderAmount = priceOption.price;
    let finalPayAmount = originalOrderAmount;
    let validatedCouponData: Awaited<ReturnType<typeof validateCoupon>> | null = null;

    if (params.couponCode?.trim()) {
      const couponRes = await validateCoupon(
        params.couponCode.trim(),
        userId,
        originalOrderAmount,
        { serviceId: params.serviceId, categoryId: service.categoryId }
      );
      finalPayAmount = couponRes.finalAmount;
      validatedCouponData = couponRes;
    }

    // Thực hiện transaction Serializable + retry để CHỐNG DOUBLE-SPEND
    const result = await runSerializableWithRetry(() =>
      db.$transaction(
        async (tx) => {
          // 1. Tính số dư khả dụng từ sổ cái (aggregate, nhất quán)
          const currentBalance = await getBalanceInTx(tx, userId);

      // 2. Kiểm tra số dư ví
      if (currentBalance < finalPayAmount) {
        throw new Error("Số dư tài khoản không đủ để thanh toán dịch vụ này");
      }

      // Sinh mã đơn hàng dạng GF-YYYY-XXXX (ví dụ: GF-2026-1025)
      const count = await tx.order.count();
      const orderNumber = `GF-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

      // 3. Tạo đơn hàng mới
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          serviceId: params.serviceId,
          priceOptionId: params.priceOptionId,
          amount: finalPayAmount,
          status: "waiting_admin_accept", // Chờ duyệt
          uid: params.uid,
          server: params.server,
          note: params.note,
        },
      });

      // Tạo bản ghi CouponRedemption nếu có coupon
      if (validatedCouponData) {
        await tx.couponRedemption.create({
          data: {
            couponId: validatedCouponData.coupon.id,
            userId,
            orderId: newOrder.id,
            discountAmount: validatedCouponData.discountAmount,
          },
        });
      }

      // 4. Tạo mật khẩu game tạm thời (mã hóa AES-256-GCM bảo mật tuyệt đối)
      await tx.orderCredential.create({
        data: {
          orderId: newOrder.id,
          encryptedPassword: encrypt(params.gamePasswordPlain),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Hết hạn sau 7 ngày
        },
      });

      // 5. Tạo giao dịch tạm giữ tiền (HOLD) trong ví sổ cái
      await tx.walletTransaction.create({
        data: {
          userId,
          type: "hold",
          amount: -finalPayAmount,
          balance: currentBalance - finalPayAmount,
          description: `Tạm giữ tiền cho đơn hàng ${orderNumber} (${service.name})${validatedCouponData ? ` [Áp dụng mã ${validatedCouponData.coupon.code}]` : ""}`,
          orderId: newOrder.id,
          status: "success",
        },
      });

      // 6. Ghi nhật ký trạng thái đơn hàng ban đầu
      await tx.orderStatusLog.create({
        data: {
          orderId: newOrder.id,
          status: "pending_payment",
          createdBy: "system",
        },
      });

      await tx.orderStatusLog.create({
        data: {
          orderId: newOrder.id,
          status: "waiting_admin_accept",
          createdBy: "system",
          note: "Đã tạm giữ số dư ví, đang chờ Admin tiếp nhận.",
        },
      });

          return newOrder;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      )
    );

    // Trigger Telegram Notification (nếu có cấu hình bot)
    try {
      const user = await db.user.findUnique({ where: { id: userId } });
      const service = await db.service.findUnique({ where: { id: params.serviceId } });
      if (user && service) {
        await notifyNewOrder({
          orderNumber: result.orderNumber,
          serviceName: service.name,
          amount: result.amount,
          userName: user.name,
          server: result.server,
        });
      }
    } catch (notifyErr) {
      console.warn("Không thể gửi thông báo Telegram khi tạo đơn:", notifyErr);
    }

    return { success: true, order: result };
  } catch (error) {
    console.error("Lỗi đặt đơn Server Action:", error);
    return { error: error instanceof Error ? error.message : "Không thể hoàn tất tạo đơn hàng" };
  }
}
