"use server";

import { db } from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { cookies, headers } from "next/headers";
import { getBalanceInTx } from "@/modules/wallet/balance";

export async function adjustWalletBalance(
  targetUserId: string,
  amount: number,
  description: string
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return { error: "Bạn cần đăng nhập quyền Admin" };
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return { error: "Từ chối truy cập. Bạn không phải Admin." };
    }

    const adminId = payload.userId;
    const adminName = payload.name || payload.email || "Admin";

    const hdrs = await headers();
    const ipAddress =
      hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    // Lấy thông tin khách hàng bị thay đổi số dư
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return { error: "Khách hàng mục tiêu không tồn tại" };
    }

    // Thực hiện cộng/trừ trong transaction an toàn
    const result = await db.$transaction(async (tx) => {
      // Tính số dư hiện tại từ ledger
      const previousBalance = await getBalanceInTx(tx, targetUserId);

      // Tạo giao dịch điều chỉnh (ADJUST)
      const newTx = await tx.walletTransaction.create({
        data: {
          userId: targetUserId,
          type: "adjust",
          amount: amount, // Có thể âm (trừ tiền) hoặc dương (cộng tiền)
          balance: previousBalance + amount,
          description: description || `Admin ${adminName} điều chỉnh số dư ví`,
          status: "success",
        },
      });

      // Ghi nhận lịch sử audit log bảo mật
      await tx.adminAuditLog.create({
        data: {
          adminId,
          adminName,
          action: amount >= 0 ? "WALLET_ADD" : "WALLET_SUBTRACT",
          target: targetUser.email,
          details: `Admin điều chỉnh số dư của ${targetUser.name} (${targetUser.email}). Số tiền: ${amount >= 0 ? "+" : ""}${amount}đ. Lý do: ${description}`,
          ipAddress,
        },
      });

      return newTx;
    });

    return { success: true, transaction: result };
  } catch (error) {
    console.error("Lỗi điều chỉnh ví Admin Action:", error);
    return { error: error instanceof Error ? error.message : "Không thể thực hiện điều chỉnh ví" };
  }
}
