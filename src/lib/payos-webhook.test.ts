import { describe, expect, it } from "vitest";
import { resolveWebhookIdempotencyKey, amountsMatch } from "./payos-webhook";

describe("resolveWebhookIdempotencyKey (P0-2 idempotency)", () => {
  it("ưu tiên reference", () => {
    expect(
      resolveWebhookIdempotencyKey({ reference: "TXN123", orderCode: 999 })
    ).toBe("ref:TXN123");
  });

  it("fallback paymentLinkId khi thiếu reference", () => {
    expect(
      resolveWebhookIdempotencyKey({ paymentLinkId: "PL9", orderCode: 999 })
    ).toBe("pl:PL9");
  });

  it("fallback orderCode khi thiếu reference & paymentLinkId", () => {
    expect(resolveWebhookIdempotencyKey({ orderCode: 123456 })).toBe("oc:123456");
  });

  it("REGRESSION P0-2: ỔN ĐỊNH — gọi nhiều lần ra CÙNG key (không dùng Date.now/random)", () => {
    const data = { orderCode: 777 };
    const k1 = resolveWebhookIdempotencyKey(data);
    const k2 = resolveWebhookIdempotencyKey(data);
    expect(k1).toBe(k2);
    expect(k1).toBe("oc:777");
  });

  it("thiếu tất cả định danh -> ném lỗi (không xử lý mù để tránh cộng tiền sai)", () => {
    expect(() => resolveWebhookIdempotencyKey({})).toThrow();
    expect(() =>
      resolveWebhookIdempotencyKey({ reference: "", paymentLinkId: "", orderCode: "" })
    ).toThrow();
  });
});

describe("amountsMatch (P0-3 verify amount)", () => {
  it("khớp khi bằng nhau", () => {
    expect(amountsMatch(100000, 100000)).toBe(true);
  });

  it("KHÔNG khớp khi lệch số tiền", () => {
    expect(amountsMatch(100000, 50000)).toBe(false);
    expect(amountsMatch(1, 100000)).toBe(false);
  });

  it("làm tròn về đồng VND", () => {
    expect(amountsMatch(100000.4, 100000)).toBe(true);
  });
});
