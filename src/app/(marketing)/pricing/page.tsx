import type { Metadata } from "next";
import Link from "next/link";

import { ArrowRight, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

import { formatCurrency } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import { FloatingShapes } from "@/components/animations/FloatingShapes";
import { GradientText } from "@/components/animations/GradientText";
import { MeshGradient } from "@/components/animations/MeshGradient";
import { Reveal } from "@/components/animations/Reveal";
import { TiltCard } from "@/components/animations/TiltCard";
import { ServiceCalculatorSlider } from "@/components/shared/service-calculator-slider";


export const dynamic = "force-dynamic";

interface PriceOption {
  id: string;
  name: string;
  price: number;
  originalPrice?: number | null;
}

interface ServiceData {
  id: string;
  name: string;
  description: string;
  category: { id: string; name: string; icon: string } | null;
  difficulty?: string | null;
  estimatedTime?: string | null;
  isPopular: boolean;
  isActive: boolean;
  requirements?: string | null;
  priceOptions: PriceOption[];
}

const PRICING_FAQS = [
  {
    question: "Bảng giá có minh bạch và không phát sinh phí ẩn không?",
    answer:
      "100% minh bạch. Số tiền hiển thị khi chọn gói là số tiền duy nhất bạn cần thanh toán qua Ví nội bộ.",
  },
  {
    question: "Thanh toán dịch vụ như thế nào?",
    answer:
      "Bạn nạp tiền vào ví qua mã QR ngân hàng tự động (PayOS/VietQR). Số dư ví sẽ được dùng để đặt các dịch vụ game.",
  },
  {
    question: "Tôi có được hoàn tiền nếu dịch vụ không hoàn thành đúng cam kết?",
    answer:
      "Có. Mọi dịch vụ không đúng cam kết hoặc quá hạn sẽ được hoàn tiền 100% trực tiếp vào Ví sổ cái của bạn qua tính năng Khiếu nại.",
  },
  {
    question: "Có mã giảm giá cho khách hàng mới hoặc đơn đầu tiên không?",
    answer:
      "Có! Bạn có thể nhập mã giảm giá (Voucher) ngay tại bước Checkout để được chiết khấu từ 10% đến 50.000đ.",
  },
];

async function fetchServices(): Promise<ServiceData[]> {
  try {
    const rows = await db.service.findMany({
      where: { isActive: true },
      include: { priceOptions: true, category: true },
      orderBy: [{ isPopular: "desc" }, { name: "asc" }],
    });
    return rows as unknown as ServiceData[];
  } catch (error) {
    console.error("Lỗi lấy danh sách dịch vụ trang pricing:", error);
    return [];
  }
}

export const metadata: Metadata = {
  title: "Bảng giá Dịch vụ Game minh bạch | Genshin77",
  description:
    "Bảng giá dịch vụ cày thuê Genshin Impact minh bạch, cập nhật theo thời gian thực. Đặt đơn dễ dàng qua Ví nội bộ an toàn.",
  openGraph: {
    title: "Bảng giá Dịch vụ Game minh bạch | Genshin77",
    description: "Bảng giá dịch vụ Genshin Impact minh bạch, không phí ẩn.",
    type: "website",
    locale: "vi_VN",
  },
};

export default async function PricingPage() {
  const services = await fetchServices();

  return (
    <main className="relative z-[1] overflow-hidden px-4 pb-20 pt-28">
      {/* Hero decoration */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem] bg-gradient-to-b from-amber-500/5 via-transparent to-transparent" />
      <FloatingShapes className="absolute inset-x-0 top-0 -z-10 h-[60rem] opacity-40" aria-hidden />
      <MeshGradient className="absolute inset-x-0 top-0 -z-10 h-[60rem]" count={3} intensity={0.4} aria-hidden />

      {/* Header */}
      <section className="relative mx-auto mb-14 max-w-4xl text-center">
        <Reveal>
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-500">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Bảng Giá Niêm Yết Minh Bạch
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="mb-6 font-heading text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
            Bảng giá dịch vụ{" "}
            <GradientText gradient="linear-gradient(135deg,#3b82f6 0%,#f59e0b 100%)">
              Game chuyên nghiệp
            </GradientText>
          </h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mx-auto max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">
            Tất cả gói dịch vụ đều được niêm yết rõ ràng — không phí ẩn, bảo hành
            chuẩn cam kết, hoàn tiền 100% nếu không đạt mục tiêu.
          </p>
        </Reveal>
      </section>

      {/* Calculator Section */}
      <section className="mx-auto mb-16 max-w-4xl">
        <Reveal>
          <ServiceCalculatorSlider />
        </Reveal>
      </section>

      {/* Real services grid */}
      <section className="mx-auto max-w-6xl">
        {services.length === 0 ? (
          <Reveal>
            <Card className="border-dashed p-12 text-center">
              <p className="text-muted-foreground">Chưa có dịch vụ nào khả dụng.</p>
            </Card>
          </Reveal>
        ) : (
          <div
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {services.map((service) => (
              <Reveal key={service.id} delay={0.05 * services.indexOf(service)}>
                <TiltCard maxRotation={4} className="h-full">
                  <Card
                    className={cn(
                      "tilt-card group relative flex h-full flex-col overflow-hidden border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-300",
                      service.isPopular &&
                        "border-amber-500/50 shadow-lg shadow-amber-500/5"
                    )}
                  >
                    {service.isPopular ? (
                      <>
                        <span
                          aria-hidden
                          className="absolute inset-x-0 top-0 h-1 bg-gradient-amber"
                        />
                        <div className="absolute right-0 top-0 bg-amber-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-black rounded-bl-lg">
                          Hot / Phổ biến
                        </div>
                      </>
                    ) : null}

                    <CardContent className="flex flex-1 flex-col p-6">
                      {service.category ? (
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-amber-500">
                          {service.category.icon} {service.category.name}
                        </span>
                      ) : null}
                      <h3 className="mb-2 font-heading text-xl font-bold text-foreground">
                        {service.name}
                      </h3>
                      <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground">
                        {service.description}
                      </p>

                      <div className="mb-6 space-y-2">
                        <span className="mb-1 block text-xs font-medium text-muted-foreground">
                          Tùy chọn gói dịch vụ:
                        </span>
                        {service.priceOptions.map((opt) => (
                          <div
                            key={opt.id}
                            className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 px-3.5 py-2.5 text-sm transition-colors hover:bg-muted/50"
                          >
                            <span className="font-medium text-foreground">{opt.name}</span>
                            <div className="text-right">
                              <span className="font-bold text-amber-500">
                                {opt.price === 0 ? "Liên hệ báo giá" : formatCurrency(opt.price)}
                              </span>
                              {opt.originalPrice != null &&
                                opt.originalPrice > opt.price ? (
                                <span className="block text-[11px] text-muted-foreground line-through">
                                  {formatCurrency(opt.originalPrice)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mb-5 flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
                        {service.estimatedTime ? (
                          <span className="flex items-center">
                            <Clock className="mr-1 h-3.5 w-3.5 text-amber-500" />
                            {service.estimatedTime}
                          </span>
                        ) : null}
                        {service.difficulty ? (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-foreground">
                            {service.difficulty}
                          </span>
                        ) : null}
                      </div>

                      <Link href={`/order/create?service=${service.id}`} className="block w-full">
                        <Button className="w-full bg-primary font-bold hover:bg-primary/90">
                          Đặt dịch vụ ngay
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* FAQ */}
      <FAQAccordion
        heading="Câu hỏi thường gặp về thanh toán"
        subheading="Giải đáp thắc mắc về quy trình thanh toán và chính sách bảo hành."
        items={PRICING_FAQS}
        className="mt-24"
      />
    </main>
  );
}
