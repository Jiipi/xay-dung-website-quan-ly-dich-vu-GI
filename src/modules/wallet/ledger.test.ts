import { describe, expect, it } from "vitest";
import { computeBalance } from "./ledger";

describe("computeBalance (ví sổ cái)", () => {
  it("chỉ cộng các giao dịch status=success", () => {
    expect(
      computeBalance([
        { amount: 500000, status: "success" },
        { amount: -80000, status: "success" },
        { amount: 999999, status: "failed" },
        { amount: 123, status: "pending" },
      ])
    ).toBe(420000);
  });

  it("danh sách rỗng = 0", () => {
    expect(computeBalance([])).toBe(0);
  });

  it("REGRESSION P0-1: hủy đơn phải đưa số dư về ĐÚNG trước khi đặt (không cộng gấp đôi)", () => {
    // Nạp 500k trước khi đặt đơn
    const balanceBefore = computeBalance([{ amount: 500000, status: "success" }]);
    expect(balanceBefore).toBe(500000);

    // Đặt đơn 80k -> hold -80k (success)
    const afterHold = [
      { amount: 500000, status: "success" },
      { amount: -80000, status: "success" },
    ];
    expect(computeBalance(afterHold)).toBe(420000);

    // FIX: giữ hold + thêm refund +80k -> số dư = 500k (đúng)
    const afterCancelFixed = [
      ...afterHold,
      { amount: 80000, status: "success" },
    ];
    expect(computeBalance(afterCancelFixed)).toBe(balanceBefore);

    // BUG CŨ (mô phỏng): void hold (failed) + refund +80k -> 580k (SAI, double refund)
    const afterCancelBuggy = [
      { amount: 500000, status: "success" },
      { amount: -80000, status: "failed" }, // hold bị void -> loại khỏi tổng
      { amount: 80000, status: "success" }, // refund
    ];
    expect(computeBalance(afterCancelBuggy)).toBe(580000);
    expect(computeBalance(afterCancelBuggy)).not.toBe(balanceBefore);
  });
});
