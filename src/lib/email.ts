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
          from: process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || "Genshin77 <onboarding@resend.dev>",
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

interface ContactEmailParams {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function generateContactFormEmail({ name, email, subject, message }: ContactEmailParams): string {
  // Sanitize simple text to prevent basic XSS in email preview
  const safeName = name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeEmail = email.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeSubject = subject.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #2563eb; margin-top: 0;">Genshin77 — Tin nhắn Liên hệ mới</h2>
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 4px 0;"><strong>Họ tên:</strong> ${safeName}</p>
        <p style="margin: 4px 0;"><strong>Email khách hàng:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
        <p style="margin: 4px 0;"><strong>Chủ đề:</strong> ${safeSubject}</p>
      </div>
      <h3 style="color: #1e293b; font-size: 16px;">Nội dung tin nhắn:</h3>
      <div style="background-color: #ffffff; padding: 16px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</div>
      <p style="color: #64748b; font-size: 12px; margin-top: 24px; text-align: center;">Email này được gửi tự động từ form liên hệ trên website Genshin77.</p>
    </div>
  `;
}
