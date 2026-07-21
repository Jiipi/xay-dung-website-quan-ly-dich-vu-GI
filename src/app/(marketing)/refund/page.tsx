import type { Metadata } from "next";
import { FileText } from "lucide-react";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Reveal } from "@/components/animations/Reveal";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Chính sách hoàn tiền" };

const SECTIONS = [
  {
    title: "1. Nguyên tắc chung",
    body: "Genshin77 cam kết đảm bảo quyền lợi khách hàng. Hoàn tiền sẽ được thực hiện vào ví nội bộ trên nền tảng.",
  },
  {
    title: "2. Trường hợp được hoàn tiền 100%",
    items: [
      "Dịch vụ không thể hoàn thành do lỗi từ phía Genshin77.",
      "Admin không nhận đơn trong vòng 24 giờ kể từ khi đặt.",
      "Đơn hàng bị hủy trước khi admin bắt đầu xử lý.",
    ],
  },
  {
    title: "3. Trường hợp hoàn tiền một phần",
    items: [
      "Dịch vụ chỉ hoàn thành một phần (ví dụ: La Hoàn chỉ đạt 33/36 sao) – hoàn tiền theo tỷ lệ tương ứng.",
    ],
  },
  {
    title: "4. Trường hợp KHÔNG hoàn tiền",
    items: [
      "Khách hàng cung cấp thông tin sai (UID, server, mật khẩu).",
      "Khách hàng đổi mật khẩu game trong quá trình xử lý mà không thông báo.",
      "Tài khoản bị HoYoverse khóa/ban do vi phạm điều khoản (không liên quan đến dịch vụ).",
      "Dịch vụ đã hoàn thành và được khách hàng xác nhận.",
    ],
  },
  {
    title: "5. Quy trình hoàn tiền",
    items: [
      "Khách hàng liên hệ admin qua chat trong đơn hàng hoặc email.",
      "Admin xem xét và phản hồi trong vòng 24 giờ.",
      "Nếu đủ điều kiện, tiền sẽ được hoàn vào ví trong vòng 1 giờ.",
    ],
  },
];

export default function RefundPage() {
  return (
    <MarketingPageShell className="pt-28 pb-16 px-4">
      {/* Hero header */}
      <section className="mx-auto mb-12 max-w-3xl text-center">
        <Reveal>
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/5 px-3 py-1 text-xs font-semibold text-amber-500">
            <FileText className="h-3.5 w-3.5" aria-hidden />
            Chính sách hoàn tiền
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="mb-4 font-heading text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
            Chính sách{" "}
            <span className="bg-gradient-to-r from-blue-500 to-amber-500 bg-clip-text text-transparent">
              hoàn tiền
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