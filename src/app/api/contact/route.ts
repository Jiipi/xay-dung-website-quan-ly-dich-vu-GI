import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail, generateContactFormEmail } from "@/lib/email";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  email: z.string().trim().email("Email không hợp lệ"),
  subject: z.string().trim().min(3, "Chủ đề phải có ít nhất 3 ký tự"),
  message: z.string().trim().min(10, "Nội dung phải có ít nhất 10 ký tự"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = parsed.data;
    const recipientEmail = process.env.SUPPORT_EMAIL || "ngochungtran.aity@gmail.com";

    const emailHtml = generateContactFormEmail({
      name,
      email,
      subject,
      message,
    });

    const result = await sendEmail({
      to: recipientEmail,
      subject: `[Liên hệ mới] ${subject} - Từ: ${name}`,
      html: emailHtml,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Không thể gửi email lúc này. Vui lòng thử lại sau." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Gửi tin nhắn thành công! Chúng tôi sẽ phản hồi bạn trong thời gian sớm nhất.",
    });
  } catch (error) {
    console.error("Lỗi API liên hệ:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
