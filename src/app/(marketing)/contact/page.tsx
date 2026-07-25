import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  HelpCircle,
  MapPin,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContactForm } from "./_contact-form";
import {
  ContactChannelList,
  type ContactChannelKey,
} from "./_components/ContactChannelList";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Reveal } from "@/components/animations/Reveal";

const SUPPORT_EMAIL = "support@Genshin77.vn";
const ZALO_NUMBER = "+84 909 123 456";
const DISCORD = "Genshin77";

export const metadata: Metadata = {
  title: "Liên hệ",
  description:
    "Liên hệ với Genshin77 qua email, Zalo, Telegram hoặc Discord. Hỗ trợ 24/7, phản hồi trong vòng 24 giờ.",
  openGraph: {
    title: "Liên hệ Genshin77",
    description: "Liên hệ với chúng tôi qua email, Zalo, Telegram, Discord.",
    type: "website",
    locale: "vi_VN",
  },
};

interface ChannelDef {
  iconName: ContactChannelKey;
  title: string;
  value: string;
  desc: string;
  href: string;
  color: string;
  bg: string;
}

const CHANNELS: ChannelDef[] = [
  {
    iconName: "mail",
    title: "Email",
    value: SUPPORT_EMAIL,
    desc: "Phản hồi trong vòng 24 giờ làm việc.",
    href: `mailto:${SUPPORT_EMAIL}`,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    iconName: "zalo",
    title: "Zalo",
    value: ZALO_NUMBER,
    desc: "Hỗ trợ trực tiếp 24/7 qua Zalo.",
    href: `https://zalo.me/${ZALO_NUMBER.replace(/\s/g, "")}`,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    iconName: "discord",
    title: "Discord",
    value: DISCORD,
    desc: `Server: ${DISCORD}`,
    href: `https://discord.gg/${DISCORD}`,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
];

export default function ContactPage() {
  return (
    <MarketingPageShell className="pt-28 pb-20 px-4">
      {/* Header */}
      <section className="max-w-4xl mx-auto text-center mb-16">
        <Reveal>
          <Badge
            variant="outline"
            className="mb-4 border-amber-500/30 text-amber-500"
          >
            Liên hệ
          </Badge>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight">
            Liên hệ với{" "}
            <span className="text-gradient-brand bg-gradient-to-r from-blue-600 to-amber-500 bg-clip-text text-transparent">
              Genshin77
            </span>
          </h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Có thắc mắc, góp ý hay cần hỗ trợ? Chọn kênh liên hệ thuận tiện nhất
            với bạn — đội ngũ CSKH luôn sẵn sàng.
          </p>
        </Reveal>
      </section>

      {/* Contact channels + Form */}
      <section className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-8 mb-20">
        {/* Left: channels */}
        <div className="lg:col-span-2 space-y-4">
          <Reveal>
            <h2 className="text-xl font-bold mb-2">Kênh liên hệ</h2>
          </Reveal>
          <ContactChannelList channels={CHANNELS} />

          {/* Quick stats */}
          <Reveal>
            <Card className="border-border/50 mt-6">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>Hỗ trợ 24/7 — phản hồi trong vài phút</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <span>Hoạt động toàn quốc &amp; quốc tế</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <HelpCircle className="h-4 w-4 text-emerald-500" />
                  <span>FAQ có sẵn — xem trước khi liên hệ</span>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>

        {/* Right: form */}
        <div className="lg:col-span-3">
          <Reveal delay={0.15}>
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-xl font-bold mb-1">
                  Gửi tin nhắn cho chúng tôi
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Điền form — chúng tôi sẽ nhận tin nhắn và phản hồi qua email trong vòng 24 giờ làm việc.
                </p>
                <ContactForm supportEmail={SUPPORT_EMAIL} />
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* FAQ link */}
      <section className="max-w-3xl mx-auto text-center">
        <Reveal>
          <Card className="border-blue-500/30 bg-gradient-card hover-lift">
            <CardContent className="p-8">
              <HelpCircle className="h-10 w-10 text-blue-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold mb-2">Xem FAQ trước nhé</h2>
              <p className="text-muted-foreground mb-6">
                Hầu hết thắc mắc phổ biến đều đã được tổng hợp trong trang Câu
                hỏi thường gặp.
              </p>
              <Link href="/faq">
                <Button
                  size="lg"
                  variant="outline"
                  className="font-semibold"
                >
                  Mở trang FAQ
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </Reveal>
      </section>
    </MarketingPageShell>
  );
}
