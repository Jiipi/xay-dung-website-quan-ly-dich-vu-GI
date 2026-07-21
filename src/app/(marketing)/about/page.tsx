import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { AboutTimeline } from "./_components/AboutTimeline";
import { AboutValues } from "./_components/AboutValues";
import { GradientText } from "@/components/animations/GradientText";
import { Reveal } from "@/components/animations/Reveal";
import { TiltCard } from "@/components/animations/TiltCard";

const STATS: { value: number; suffix?: string; label: string }[] = [
  { value: 2024, label: "Năm thành lập" },
  { value: 1000, suffix: "+", label: "Đơn hoàn thành" },
  { value: 500, suffix: "+", label: "Khách hàng" },
  { value: 4.9, suffix: "/5", label: "Đánh giá" },
];

export const metadata: Metadata = {
  title: "Về Genshin77",
  description:
    "Câu chuyện, sứ mệnh và giá trị cốt lõi của Genshin77 — nền tảng dịch vụ Genshin Impact chuyên nghiệp #1 Việt Nam.",
  openGraph: {
    title: "Về Genshin77",
    description: "Câu chuyện, sứ mệnh và giá trị cốt lõi của Genshin77.",
    type: "website",
    locale: "vi_VN",
  },
};

export default function AboutPage() {
  return (
    <main className="relative z-[1] overflow-hidden px-4 pb-20 pt-28">
      {/* Hero */}
      <section className="relative mx-auto mb-20 max-w-4xl text-center">
        <Reveal>
          <span className="mb-4 inline-flex rounded-full border border-amber-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-500">
            About
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="mb-6 font-heading text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Về{" "}
            <GradientText gradient="linear-gradient(135deg,#3b82f6 0%,#f59e0b 100%)">
              Genshin77
            </GradientText>
          </h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mx-auto max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">
            Chúng tôi xây dựng nền tảng dịch vụ Genshin Impact với tiêu chuẩn bảo
            mật cao nhất, quy trình minh bạch và đội ngũ tận tâm — để game thủ
            Việt chinh phục Teyvat không giới hạn.
          </p>
        </Reveal>
      </section>

      {/* Stats */}
      <section className="mx-auto mb-24 max-w-5xl">
        <Reveal>
          <div className="grid grid-cols-2 gap-y-10 rounded-3xl border border-border/50 bg-card/30 px-6 py-10 backdrop-blur-sm lg:grid-cols-4">
            {STATS.map((s, idx) => (
              <div key={idx} className="px-4 text-center">
                <div className="mb-2 font-heading text-4xl font-extrabold text-primary tabular-nums sm:text-5xl">
                  <GradientText>
                    {s.value.toLocaleString("vi-VN")}
                    {s.suffix ?? ""}
                  </GradientText>
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Story */}
      <section className="mx-auto mb-24 max-w-4xl">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <Reveal>
            <span className="mb-3 inline-flex rounded-full border border-blue-500/30 px-3 py-1 text-xs font-semibold text-blue-500">
              Câu chuyện
            </span>
            <h2 className="mb-4 font-heading text-3xl font-bold text-balance sm:text-4xl">
              Bắt đầu từ niềm đam mê game
            </h2>
            <div className="space-y-4 leading-relaxed text-muted-foreground">
              <p>
                Genshin77 ra đời năm 2024 từ một nhóm booster nhỏ tại Việt
                Nam, sau khi nhận ra thị trường dịch vụ game thiếu vắng những
                nền tảng{" "}
                <span className="font-semibold text-foreground">
                  thực sự minh bạch
                </span>{" "}
                và an toàn.
              </p>
              <p>
                Chúng tôi từng chứng kiến quá nhiều khách hàng bị lừa đảo, tài
                khoản bị đánh cắp, hoặc trả phí mà không nhận được kết quả. Đó
                là lý do Genshin77 tồn tại: xây dựng một nền tảng{" "}
                <span className="font-semibold text-foreground">
                  đặt chữ tín lên hàng đầu
                </span>
                .
              </p>
              <p>
                Từ 100 đơn hàng đầu tiên, chúng tôi đã không ngừng cải tiến — từ
                mã hóa AES-256, ví nội bộ với sổ cái bất biến, cho đến đội ngũ
                hỗ trợ 24/7 — để mỗi khách hàng đều cảm thấy an tâm tuyệt đối.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <TiltCard maxRotation={4}>
              <Card className="relative overflow-hidden border-border/50 bg-gradient-card">
                <CardContent className="p-8">
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-1 bg-gradient-brand"
                  />
                  <Sparkles className="mb-4 h-10 w-10 text-amber-500" />
                  <h3 className="mb-3 text-2xl font-bold">Sứ mệnh</h3>
                  <p className="mb-4 leading-relaxed text-muted-foreground">
                    &ldquo;Mang đến dịch vụ Genshin Impact chuyên nghiệp, an
                    toàn và minh bạch — để game thủ Việt có thể tận hưởng trải
                    nghiệm tốt nhất trên hành trình chinh phục Teyvat.&rdquo;
                  </p>
                  <h3 className="mb-3 text-2xl font-bold">Tầm nhìn</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    &ldquo;Trở thành nền tảng dịch vụ game số 1 Việt Nam, đặt
                    chuẩn mực mới về bảo mật, minh bạch và chất lượng chăm sóc
                    khách hàng.&rdquo;
                  </p>
                </CardContent>
              </Card>
            </TiltCard>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto mb-24 max-w-6xl">
        <div className="mb-12 text-center">
          <Reveal>
            <span className="mb-3 inline-flex rounded-full border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-500">
              Giá trị cốt lõi
            </span>
            <h2 className="mb-3 font-heading text-3xl font-bold text-balance sm:text-4xl">
              Điều gì tạo nên Genshin77?
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Bốn giá trị là kim chỉ nam cho mọi quyết định, từ thuật toán sổ
              cái đến cách chúng tôi đào tạo booster.
            </p>
          </Reveal>
        </div>

        <AboutValues />
      </section>

      {/* Timeline */}
      <section className="mx-auto mb-20 max-w-4xl">
        <div className="mb-12 text-center">
          <Reveal>
            <span className="mb-3 inline-flex rounded-full border border-purple-500/30 px-3 py-1 text-xs font-semibold text-purple-500">
              Hành trình
            </span>
            <h2 className="mb-3 font-heading text-3xl font-bold text-balance sm:text-4xl">
              Cột mốc phát triển
            </h2>
            <p className="text-muted-foreground">
              Từ nhóm booster nhỏ đến nền tảng #1 Việt Nam.
            </p>
          </Reveal>
        </div>

        <Reveal>
          <AboutTimeline />
        </Reveal>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl text-center">
        <Reveal>
          <Card className="relative overflow-hidden border-amber-500/30 bg-gradient-card">
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-1 bg-gradient-amber"
            />
            <CardContent className="p-8 sm:p-12">
              <Users className="mx-auto mb-4 h-10 w-10 text-blue-500" />
              <h2 className="mb-3 font-heading text-2xl font-bold sm:text-3xl">
                Sẵn sàng trở thành một phần của Genshin77?
              </h2>
              <p className="mb-6 text-muted-foreground">
                Đăng ký tài khoản và trải nghiệm dịch vụ chuyên nghiệp ngay hôm
                nay.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-gradient-amber font-bold text-black hover:opacity-90"
                  >
                    Đăng ký miễn phí
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline">
                    Liên hệ hợp tác
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </section>
    </main>
  );
}
