import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Reveal } from "@/components/animations/Reveal";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Chính sách bảo mật" };

const SECTIONS = [
  {
    title: "1. Dữ liệu chúng tôi thu thập",
    items: [
      "Thông tin tài khoản: Email, tên hiển thị, mật khẩu web (được hash bằng Argon2).",
      "Thông tin đơn hàng: UID game, server, loại dịch vụ, ghi chú.",
      "Thông tin đăng nhập game tạm thời: Email/tài khoản game, mật khẩu game (được mã hóa AES-256-GCM).",
      "Lịch sử giao dịch: Nạp tiền, thanh toán, hoàn tiền.",
    ],
  },
  {
    title: "2. Cách chúng tôi bảo vệ dữ liệu",
    items: [
      "Mật khẩu web được hash bằng Argon2, không thể đọc ngược.",
      "Mật khẩu game được mã hóa hai chiều (AES-256-GCM) với khóa bí mật riêng biệt.",
      "Chỉ admin được phép xem mật khẩu game, có xác thực và ghi log mọi lần truy cập.",
      "Mật khẩu game sẽ được xóa/vô hiệu hóa tự động sau khi đơn hoàn tất hoặc bị hủy.",
      "Dữ liệu được truyền qua HTTPS.",
    ],
  },
  {
    title: "3. Chia sẻ dữ liệu",
    body: "Chúng tôi không chia sẻ, bán hoặc cho thuê dữ liệu cá nhân của bạn cho bất kỳ bên thứ ba nào.",
  },
  {
    title: "4. Quyền của bạn",
    body: "Theo Luật Bảo vệ dữ liệu cá nhân Việt Nam (có hiệu lực từ 01/01/2026), bạn có quyền yêu cầu xem, sửa đổi hoặc xóa dữ liệu cá nhân; rút lại sự đồng ý xử lý dữ liệu; và khiếu nại về việc xử lý dữ liệu.",
  },
  {
    title: "5. Liên hệ",
    body: "Nếu có câu hỏi về chính sách bảo mật, vui lòng liên hệ: support@Genshin77.vn",
  },
];

export default function PrivacyPage() {
  return (
    <MarketingPageShell className="pt-28 pb-16 px-4">
      <section className="mx-auto mb-12 max-w-3xl text-center">
        <Reveal>
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/5 px-3 py-1 text-xs font-semibold text-blue-500">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Privacy
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="mb-4 font-heading text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
            Chính sách{" "}
            <span className="bg-gradient-to-r from-blue-500 to-amber-500 bg-clip-text text-transparent">
              bảo mật
            </span>
          </h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="text-sm text-muted-foreground">
            Cập nhật lần cuối: <strong>01/07/2026</strong>
          </p>
        </Reveal>
      </section>

      <Card className="mx-auto max-w-3xl border-border/50 bg-card/40 backdrop-blur-sm">
        <CardContent className="space-y-8 p-6 sm:p-8">
          {SECTIONS.map((s, idx) => (
            <Reveal key={s.title} delay={0.05 * idx}>
              <section>
                <h2 className="mb-3 font-heading text-xl font-bold tracking-tight sm:text-2xl">
                  {s.title}
                </h2>
                {s.body ? (
                  <p className="leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                ) : (
                  <ul className="ml-5 list-disc space-y-2 leading-relaxed text-muted-foreground">
                    {s.items?.map((it) => <li key={it}>{it}</li>)}
                  </ul>
                )}
              </section>
            </Reveal>
          ))}
        </CardContent>
      </Card>
    </MarketingPageShell>
  );
}