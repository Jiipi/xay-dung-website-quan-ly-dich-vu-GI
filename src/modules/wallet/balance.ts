import type { Prisma } from "@prisma/client";

/**
 * Tính số dư khả dụng của user TRONG một Prisma transaction bằng aggregate _sum.
 * Dùng chung cho mọi nơi cần snapshot số dư (tạo đơn, nạp tiền, refund, điều chỉnh)
 * để đảm bảo NHẤT QUÁN và tránh tải toàn bộ giao dịch (P2-3 + P2-5).
 * Số dư = tổng amount của các giao dịch status = "success".
 */
export async function getBalanceInTx(
  tx: Prisma.TransactionClient,
  userId: string
): Promise<number> {
  const agg = await tx.walletTransaction.aggregate({
    where: { userId, status: "success" },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}
