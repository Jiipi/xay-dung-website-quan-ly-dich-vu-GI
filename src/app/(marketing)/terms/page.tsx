import type { Metadata } from "next";
import { ScrollText } from "lucide-react";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Reveal } from "@/components/animations/Reveal";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Điều khoản dịch vụ",
};

const SECTIONS = [
  {
    title: "1. Giới thiệu",
    body: "Chào mừng bạn đến với Genshin77. Khi sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản được nêu dưới đây.",
  },
  {
    title: "2. Dịch vụ cung cấp",
    body: "Genshin77 cung cấp dịch vụ hỗ trợ trong game Genshin Impact bao gồm nhưng không giới hạn: clear Endgame content, farm nguyên liệu, roll gacha hộ, mở map và làm event.",
  },
  {
    title: "3. Rủi ro chia sẻ tài khoản",
    body: "QUAN TRỌNG: HoYoverse (nhà phát triển Genshin Impact) nghiêm cấm việc chia sẻ tài khoản game. Khi sử dụng dịch vụ của Genshin77, bạn hiểu và chấp nhận rằng: việc chia sẻ tài khoản có thể vi phạm Điều khoản sử dụng của HoYoverse; Genshin77 không cam kết an toàn tuyệt đối cho tài khoản game của bạn; Genshin77 không chịu trách nhiệm nếu tài khoản bị HoYoverse xử lý do vi phạm điều khoản.",
  },
  {
    title: "4. Cam kết của Genshin77",
    items: [
      "Không sử dụng bot, cheat, hoặc bất kỳ tool nào can thiệp vào game.",
      "Mọi dịch vụ được thực hiện thủ công bởi người chơi có kinh nghiệm.",
      "Thông tin đăng nhập được mã hóa AES-256-GCM và chỉ hiển thị khi cần thiết.",
      "Dữ liệu đăng nhập sẽ được xóa sau khi đơn hoàn tất.",
    ],
  },
  {
    title: "5. Ví nội bộ",
    body: "Số dư trong ví Genshin77 chỉ được sử dụng để thanh toán dịch vụ trên nền tảng. Không hỗ trợ chuyển tiền giữa người dùng hoặc rút tiền về tài khoản ngân hàng.",
  },
  {
    title: "6. Quyền và Nghĩa vụ của Khách hàng",
    items: [
      "Cung cấp thông tin chính xác khi đặt đơn.",
      "Đổi mật khẩu tạm thời trước khi gửi và đổi lại sau khi đơn hoàn tất.",
      "Không gửi mật khẩu email, mã backup hoặc thông tin nhạy cảm khác.",
      "Phối hợp khi cần xác minh (ví dụ: nhập mã OTP).",
    ],
  },
  {
    title: "7. Thay đổi điều khoản",
    body: "Genshin77 có quyền thay đổi điều khoản bất cứ lúc nào. Thay đổi sẽ được thông báo trên website.",
  },
];

export default function TermsPage() {
  return (
    <MarketingPageShell className="pt-28 pb-16 px-4">
      <section className="mx-auto mb-12 max-w-3xl text-center">
        <Reveal>
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/5 px-3 py-1 text-xs font-semibold text-purple-500">
            <ScrollText className="h-3.5 w-3.5" aria-hidden />
            Terms of Service
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="mb-4 font-heading text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
            Điều khoản{" "}
            <span className="bg-gradient-to-r from-blue-500 to-amber-500 bg-clip-text text-transparent">
              dịch vụ
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