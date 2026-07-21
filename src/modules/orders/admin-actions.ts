"use server";

import { db } from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { getBalanceInTx } from "@/modules/wallet/balance";

export async function updateOrderStatusAdmin(
  orderId: string,
  newStatus: string,
  note?: string
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return { error: "Bạn cần đăng nhập quyền Admin" };
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return { error: "Bạn không có quyền thực hiện hành động này" };
    }

    const adminName = payload.name || payload.email || "Admin";

    // Tiến hành cập nhật trạng thái trong database transaction
    const updatedOrder = await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { credentials: true },
      });

      if (!order) {
        throw new Error("Không tìm thấy đơn hàng tương ứng");
      }

      const oldStatus = order.status;

      // 1. Cập nhật trạng thái đơn hàng
      const ord = await tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
        },
      });

      // 2. Ghi nhật ký status log
      await tx.orderStatusLog.create({
        data: {
          orderId,
          status: newStatus,
          note: note || `Admin cập nhật trạng thái từ ${oldStatus} sang ${newStatus}`,
          createdBy: adminName,
        },
      });

      // 3. Logic ví sổ cái (Ledger) dựa trên trạng thái mới
      if (newStatus === "completed" && oldStatus !== "completed") {
        // Đơn hàng hoàn tất -> chuyển đổi giao dịch từ HOLD sang CHARGE
        const holdTx = await tx.walletTransaction.findFirst({
          where: { orderId, type: "hold" },
        });

        if (holdTx) {
          await tx.walletTransaction.update({
            where: { id: holdTx.id },
            data: {
              type: "charge",
              description: `Thanh toán hoàn tất cho đơn hàng ${order.orderNumber}`,
            },
          });
        }
      } else if ((newStatus === "cancelled" || newStatus === "refunded") && oldStatus !== "cancelled" && oldStatus !== "refunded") {
        // Đơn bị hủy/hoàn tiền -> hoàn trả tiền đã trừ cho khách.
        // FIX P0-1 (double-refund): GIỮ NGUYÊN giao dịch đã trừ (hold/charge, vẫn success)
        // và CHỈ ghi 1 bút toán refund đối ứng (+amount). Net với khoản đã trừ (-amount) = 0
        // -> số dư trở về đúng như trước khi đặt đơn.
        // (Trước đây vừa set hold status=failed (loại khỏi tổng = +amount) VỪA tạo refund (+amount)
        //  -> khách được cộng gấp đôi số tiền đơn.)
        const deductionTx = await tx.walletTransaction.findFirst({
          where: { orderId, type: { in: ["hold", "charge"] }, status: "success" },
        });

        if (deductionTx) {
          // Số dư hiện tại (khoản đã trừ vẫn còn success trong tổng)
          const previousBalance = await getBalanceInTx(tx, order.userId);

          await tx.walletTransaction.create({
            data: {
              userId: order.userId,
              type: "refund",
              amount: order.amount, // Cộng lại đúng số tiền đơn (đối ứng khoản đã trừ)
              balance: previousBalance + order.amount,
              description: `Hoàn tiền đơn hàng ${order.orderNumber} (${newStatus === "refunded" ? "hoàn tiền" : "đã hủy"})`,
              orderId: order.id,
              status: "success",
            },
          });
        }
      }

      // 4. Logic bảo mật tự động xóa tài khoản mật khẩu game
      if (
        newStatus === "completed" ||
        newStatus === "cancelled" ||
        newStatus === "refunded"
      ) {
        if (order.credentials) {
          // Xóa hoàn toàn bản ghi chứa mật khẩu game khỏi database
          await tx.orderCredential.delete({
            where: { orderId },
          });
          console.log(`Bảo mật: Đã xóa sạch thông tin tài khoản game của đơn hàng ${order.orderNumber}`);
        }
      }

      return ord;
    });

    return { success: true, order: updatedOrder };
  } catch (error) {
    console.error("Lỗi cập nhật đơn hàng phía Admin:", error);
    return { error: error instanceof Error ? error.message : "Không thể cập nhật trạng thái đơn hàng" };
  }
}
