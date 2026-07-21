/**
 * Hàm thuần hỗ trợ xử lý webhook PayOS — KHÔNG phụ thuộc DB/SDK, dễ test.
 */

export interface WebhookIdentifiers {
  reference?: string | null;
  paymentLinkId?: string | null;
  orderCode?: number | string | null;
}

/**
 * Sinh khóa idempotency ỔN ĐỊNH cho một webhook để chống xử lý trùng.
 *
 * QUAN TRỌNG: tuyệt đối KHÔNG dùng Date.now()/random — nếu không mỗi lần PayOS
 * gửi lại (retry) sẽ ra khóa khác nhau và hệ thống sẽ cộng tiền nhiều lần.
 * Ưu tiên `reference` (duy nhất theo giao dịch) → `paymentLinkId` → `orderCode`.
 * Nếu thiếu tất cả, ném lỗi để KHÔNG xử lý (an toàn hơn là cộng tiền mù).
 */
export function resolveWebhookIdempotencyKey(data: WebhookIdentifiers): string {
  if (data.reference) return `ref:${data.reference}`;
  if (data.paymentLinkId) return `pl:${data.paymentLinkId}`;
  if (data.orderCode !== undefined && data.orderCode !== null && `${data.orderCode}` !== "") {
    return `oc:${data.orderCode}`;
  }
  throw new Error(
    "Webhook PayOS thiếu reference/paymentLinkId/orderCode — không thể chống trùng an toàn"
  );
}

/** So khớp số tiền webhook với số tiền PaymentIntent (làm tròn về đồng VND). */
export function amountsMatch(webhookAmount: number, intentAmount: number): boolean {
  return Math.round(Number(webhookAmount)) === Math.round(Number(intentAmount));
}
