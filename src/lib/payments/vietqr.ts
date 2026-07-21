/**
 * VietQR & NAPAS247 Quick QR Generator for Automatic Banking Deposits
 */

export interface VietQRConfig {
  bankId: string;       // e.g., 'seabank', 'MB', 'VCB', 'ICB', 'TCB'
  accountNo: string;    // e.g., '1900888999'
  accountName: string;  // e.g., 'GENSHIN77 SERVICE CORP'
  template?: 'compact' | 'compact2' | 'qr_only' | 'print';
}

export const DEFAULT_BANK_CONFIG: VietQRConfig = {
  bankId: process.env.BANK_ID || "seabank",
  accountNo: process.env.BANK_ACCOUNT_NO || "7700998888",
  accountName: process.env.BANK_ACCOUNT_NAME || "GENSHIN77 SHOP DICH VU",
  template: "compact2",
};

/**
 * Generates a direct VietQR image URL with embedded amount and payment code.
 */
export function generateVietQRUrl(params: {
  amount: number;
  paymentCode: string;
  bankConfig?: Partial<VietQRConfig>;
}): string {
  const config = { ...DEFAULT_BANK_CONFIG, ...params.bankConfig };
  const bankId = encodeURIComponent(config.bankId);
  const accountNo = encodeURIComponent(config.accountNo);
  const template = config.template || "compact2";

  const amount = Math.max(0, Math.floor(params.amount));
  const addInfo = encodeURIComponent(params.paymentCode.trim());
  const accountName = encodeURIComponent(config.accountName.trim());

  return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${addInfo}&accountName=${accountName}`;
}
