"use client";

import { useState, type FormEvent } from "react";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const initialState: FormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export function ContactForm({ supportEmail }: { supportEmail: string }) {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const validate = (): string | null => {
    if (!form.name.trim()) return "Vui lòng nhập họ tên.";
    if (form.name.trim().length < 2) return "Họ tên phải có ít nhất 2 ký tự.";
    if (!form.email.trim()) return "Vui lòng nhập email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      return "Email không hợp lệ.";
    if (!form.subject.trim()) return "Vui lòng nhập chủ đề.";
    if (form.subject.trim().length < 3) return "Chủ đề quá ngắn.";
    if (!form.message.trim()) return "Vui lòng nhập nội dung.";
    if (form.message.trim().length < 10)
      return "Nội dung phải có ít nhất 10 ký tự để chúng tôi hỗ trợ tốt nhất.";
    return null;
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setStatus("error");
      setErrorMsg(err);
      return;
    }
    setStatus("submitting");
    setErrorMsg(null);

    // Tránh xung đột khi user chưa cài mail client: tạo mailto URL và alert fallback.
    const mailto = `mailto:${encodeURIComponent(supportEmail)}?subject=${encodeURIComponent(
      `[${form.subject.trim()}] ${form.name.trim()}`
    )}&body=${encodeURIComponent(
      `Họ tên: ${form.name.trim()}\nEmail: ${form.email.trim()}\n\n${form.message.trim()}`
    )}`;

    try {
      window.location.href = mailto;
      setStatus("sent");
      setForm(initialState);
    } catch {
      // Fallback nếu trình duyệt chặn mailto
      alert(
        `Vui lòng gửi email trực tiếp đến ${supportEmail}\n\n` +
          `Họ tên: ${form.name}\n` +
          `Email: ${form.email}\n` +
          `Chủ đề: ${form.subject}\n\n` +
          `${form.message}`
      );
      setStatus("sent");
      setForm(initialState);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="contact-name">Họ tên *</Label>
        <Input
          id="contact-name"
          placeholder="Nguyễn Văn A"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className="mt-1.5"
          autoComplete="name"
          required
        />
      </div>

      <div>
        <Label htmlFor="contact-email">Email *</Label>
        <Input
          id="contact-email"
          type="email"
          placeholder="email@example.com"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          className="mt-1.5"
          autoComplete="email"
          required
        />
      </div>

      <div>
        <Label htmlFor="contact-subject">Chủ đề *</Label>
        <Input
          id="contact-subject"
          placeholder="VD: Hỏi về dịch vụ La Hoàn 36★"
          value={form.subject}
          onChange={(e) => update("subject", e.target.value)}
          className="mt-1.5"
          required
        />
      </div>

      <div>
        <Label htmlFor="contact-message">Nội dung *</Label>
        <Textarea
          id="contact-message"
          placeholder="Mô tả chi tiết vấn đề hoặc câu hỏi của bạn..."
          rows={5}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          className="mt-1.5"
          required
        />
      </div>

      {status === "error" && errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm p-3"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {status === "sent" && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm p-3"
        >
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Đã chuẩn bị email gửi đến {supportEmail}. Vui lòng xác nhận trong
            ứng dụng email của bạn.
          </span>
        </div>
      )}

      <Button
        type="submit"
        className={cn(
          "w-full bg-gradient-amber text-black hover:opacity-90 font-bold"
        )}
        disabled={status === "submitting"}
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang chuẩn bị...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Gửi tin nhắn
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Bằng cách gửi form, bạn đồng ý chúng tôi liên hệ lại qua email bạn cung
        cấp.
      </p>
    </form>
  );
}

export function ContactFormCard({
  supportEmail,
}: {
  supportEmail: string;
}) {
  return (
    <div className="border border-border/50 rounded-xl bg-card/50 backdrop-blur-sm p-6">
      <h2 className="text-xl font-bold mb-1">Gửi tin nhắn cho chúng tôi</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Điền form bên dưới — chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.
      </p>
      <ContactForm supportEmail={supportEmail} />
    </div>
  );
}
