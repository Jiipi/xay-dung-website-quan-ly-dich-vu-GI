/**
 * Hàm thuần cho ví sổ cái (ledger) — KHÔNG phụ thuộc DB, dễ test.
 *
 * Quy ước: số dư khả dụng = tổng `amount` của các giao dịch có `status === "success"`.
 * Giao dịch bị vô hiệu (failed/reversed) KHÔNG tính vào số dư.
 */
export interface LedgerEntry {
  amount: number;
  status: string;
}

/** Tính số dư từ danh sách giao dịch (chỉ cộng các giao dịch success). */
export function computeBalance(entries: LedgerEntry[]): number {
  return entries
    .filter((e) => e.status === "success")
    .reduce((sum, e) => sum + e.amount, 0);
}
