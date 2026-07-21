/**
 * Service gửi Email thông báo & Reset Mật khẩu (Resend API / SMTP)
 */

import { logger } from "@/lib/logger";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "Genshin77 <no-reply@Genshin77.vn>",
          to: [to],
          subject,
          html,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        return { success: true, id: data.id };
      }
      logger.error("resend_api_error", { status: res.status, body: data });
      return { success: false, error: data.message || "Lỗi Resend API" };
    } catch (err) {
      logger.error("resend_connection_failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      return { success: false, error: "Không thể kết nối dịch vụ Email" };
    }
  }

  // Fallback: dev không có RESEND_API_KEY → log ra stdout, KHÔNG gửi thật
  if (process.env.NODE_ENV !== "production") {
    logger.debug("email_mock_sent", {
      to,
      subject,
      bodyPreview: html.replace(/<[^>]*>?/gm, " ").slice(0, 200),
    });
  } else {
    // Production không có RESEND_API_KEY → fail thay vì giả vờ gửi
    logger.error("email_silently_failed_no_api_key", { to, subject });
    return { success: false, error: "RESEND_API_KEY chưa cấu hình" };
  }

  return { success: true, id: "mock-email-id" };
}

export function generatePasswordResetEmail(resetUrl: string, name: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 12px;">
      <h2 style="color: #2563eb; text-align: center;">Genshin77 — Khôi phục Mật Khẩu</h2>
      <p>Xin chào <strong>${name}</strong>,</p>
      <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản tại Genshin77. Vui lòng bấm vào nút bên dưới để thiết lập mật khẩu mới (Link có hiệu lực trong 15 phút):</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #f59e0b; color: #000; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Đặt Lại Mật Khẩu Ngay</a>
      </div>
      <p style="color: #666; font-size: 12px;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này để đảm bảo an toàn.</p>
    </div>
  `;
}
