import type { Metadata } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
import { Card, CardContent } from "@/components/ui/card";
import {
  HelpCircle,
  Mail,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Reveal } from "@/components/animations/Reveal";
import { FaqCategories } from "./_components/FaqCategories";

export const metadata: Metadata = {
  title: "Câu hỏi thường gặp",
  description:
    "Giải đáp những thắc mắc phổ biến nhất về dịch vụ, thanh toán, bảo mật và quy trình tại Genshin77.",
  openGraph: {
    title: "Câu hỏi thường gặp | Genshin77",
    description:
      "Giải đáp những thắc mắc phổ biến nhất về dịch vụ, thanh toán, bảo mật và quy trình.",
    type: "website",
    images: [
      {
        url: "/og-faq.png",
        width: 1200,
        height: 630,
        alt: "FAQ - Genshin77",
      },
    ],
  },
};

export default async function FAQPage() {
  const categories = await db.faqCategory.findMany({
    orderBy: { order: "asc" },
    include: {
      items: {
        where: { isActive: true },
        orderBy: { order: "asc" },
      },
    },
  });

  const activeCategories = categories.filter((c) => c.items.length > 0);
  const totalItems = activeCategories.reduce(
    (sum, c) => sum + c.items.length,
    0
  );

  return (
    <MarketingPageShell className="pt-24 pb-20">
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/15 rounded-full blur-[160px]" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[140px]" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6">
              <HelpCircle className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-white/90 font-medium">
                Trung tâm hỗ trợ
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-5 tracking-tight">
              Câu hỏi{" "}
              <span className="text-gradient-brand bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">
                thường gặp
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-lg text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
              Tổng hợp những thắc mắc phổ biến nhất về dịch vụ, thanh toán và bảo
              mật tại Genshin77. Không tìm thấy câu trả lời? Liên hệ trực tiếp
              với chúng tôi.
            </p>
          </Reveal>

          {totalItems > 0 && (
            <Reveal delay={0.3}>
              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-blue-100/70">
                <span>
                  <span className="font-bold text-white text-base">
                    {totalItems}
                  </span>{" "}
                  câu hỏi
                </span>
                <span className="h-4 w-px bg-blue-200/20" />
                <span>
                  <span className="font-bold text-white text-base">
                    {activeCategories.length}
                  </span>{" "}
                  chủ đề
                </span>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* Categories */}
      <FaqCategories
        categories={activeCategories.map((c) => ({
          id: c.id,
          name: c.name,
          items: c.items.map((it) => ({
            id: it.id,
            question: it.question,
            answer: it.answer,
            order: it.order,
          })),
        }))}
      />

      {/* CTA */}
      {activeCategories.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-16">
          <Reveal>
            <Card className="border-border/50 bg-gradient-card overflow-hidden">
              <CardContent className="p-8 sm:p-10 relative">
                <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shrink-0 shadow-lg">
                    <Sparkles className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">
                      Vẫn chưa tìm thấy câu trả lời?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Đội ngũ hỗ trợ sẵn sàng giải đáp mọi thắc mắc của bạn 24/7.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Link href="/contact">
                      <Button variant="outline" className="gap-1.5">
                        <Mail className="h-4 w-4" />
                        Gửi email
                      </Button>
                    </Link>
                    <Link href="/contact">
                      <Button className="gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold">
                        <MessageSquare className="h-4 w-4" />
                        Chat ngay
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </section>
      )}
    </MarketingPageShell>
  );
}