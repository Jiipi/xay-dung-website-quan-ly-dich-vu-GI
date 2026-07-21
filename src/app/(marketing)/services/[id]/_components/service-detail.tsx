"use client";

import Link from "next/link";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Reveal } from "@/components/animations/Reveal";
import { TiltCard } from "@/components/animations/TiltCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/constants";
import {
  ChevronRight,
  ShieldCheck,
  Zap,
  Star,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Headphones,
} from "lucide-react";

interface PriceOption {
  id: string;
  name: string;
  price: number;
  description?: string | null;
}

interface ServiceData {
  id: string;
  name: string;
  category: { id: string; name: string; icon: string } | null;
  description: string;
  basePrice?: number;
  estimatedTime?: string | null;
  isActive: boolean;
  priceOptions: PriceOption[];
}

interface ServiceDetailViewProps {
  service: ServiceData;
}

export default function ServiceDetailView({ service }: ServiceDetailViewProps) {
  const minPrice = service.priceOptions.length > 0
    ? Math.min(...service.priceOptions.map((po) => po.price))
    : service.basePrice ?? 0;

  return (
    <MarketingPageShell className="pt-28 pb-20 px-4">
      {/* Breadcrumbs */}
      <nav className="mx-auto mb-8 max-w-5xl flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/services" className="hover:text-foreground transition-colors">
          Dịch vụ
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium truncate">{service.name}</span>
      </nav>

      {/* Hero Header */}
      <section className="mx-auto mb-12 max-w-5xl">
        <Reveal>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/10 px-3 py-1 font-semibold">
              {service.category?.name?.toUpperCase() ?? "DỊCH VỤ"}
            </Badge>
            <div className="flex items-center gap-1 text-amber-400 text-sm font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              <Star className="h-4 w-4 fill-amber-400" />
              <span>4.9 / 5.0 (500+ đánh giá)</span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h1 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-balance">
            {service.name}
          </h1>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl leading-relaxed mb-8">
            {service.description}
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={`/order/create?service=${service.id}`}
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-extrabold shadow-lg shadow-amber-500/20 gap-2 px-8"
              )}
            >
              <Sparkles className="h-5 w-5" />
              Đặt dịch vụ ngay ({formatCurrency(minPrice)})
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/contact"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2")}
            >
              <Headphones className="h-4 w-4" />
              Tư vấn 24/7
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Main Grid: Options & Guarantees */}
      <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Price Options */}
        <div className="lg:col-span-2 space-y-6">
          <Reveal>
            <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Các gói tùy chọn & Bảng giá
                </CardTitle>
                <CardDescription>
                  Lựa chọn gói dịch vụ phù hợp nhất với nhu cầu tài khoản của bạn.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {service.priceOptions.length > 0 ? (
                  service.priceOptions.map((opt) => (
                    <div
                      key={opt.id}
                      className="p-4 rounded-xl border border-border/60 bg-muted/30 hover:border-amber-500/50 hover:bg-muted/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="font-semibold text-base text-foreground">{opt.name}</h4>
                        {opt.description && (
                          <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 self-end sm:self-center">
                        <span className="text-lg font-extrabold text-amber-500">
                          {formatCurrency(opt.price)}
                        </span>
                        <Link
                          href={`/order/create?service=${service.id}&option=${opt.id}`}
                          className={cn(buttonVariants({ size: "sm" }), "bg-primary text-primary-foreground font-semibold")}
                        >
                          Chọn gói
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-base">Gói tiêu chuẩn</h4>
                      <p className="text-xs text-muted-foreground">Theo mô tả dịch vụ</p>
                    </div>
                    <span className="text-lg font-extrabold text-amber-500">
                      {formatCurrency(service.basePrice ?? 0)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </Reveal>

          {/* Process steps */}
          <Reveal delay={0.1}>
            <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-500" />
                  Quy trình thực hiện bảo mật
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="relative border-l border-border/80 ml-3 space-y-6">
                  {[
                    { title: "1. Đặt đơn & Cung cấp thông tin", desc: "Điền UID, server và thông tin game bảo mật AES-256." },
                    { title: "2. Phân công Chuyên viên (Booster)", desc: "Player rank cao tiếp nhận và xử lý đơn thủ công 100%." },
                    { title: "3. Tiến hành & Báo cáo tiến độ", desc: "Theo dõi trạng thái và hình ảnh chụp màn hình trực tiếp trên Dashboard." },
                    { title: "4. Hoàn tất & Nghiệm thu", desc: "Khách hàng đổi lại mật khẩu và đánh giá chất lượng dịch vụ." },
                  ].map((step, idx) => (
                    <li key={idx} className="mb-4 ml-6">
                      <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-500 ring-4 ring-background text-xs font-bold">
                        {idx + 1}
                      </span>
                      <h5 className="font-semibold text-sm text-foreground">{step.title}</h5>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </Reveal>
        </div>

        {/* Right Column: Key Guarantees */}
        <div className="space-y-6">
          <Reveal delay={0.2}>
            <TiltCard className="h-full">
              <Card className="border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-card/80 to-card backdrop-blur-md shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-amber-500" />
                    Cam kết Genshin77
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {[
                    "Cày tay thủ công 100%, không dùng tool/hack",
                    "Mã hóa thông tin tài khoản AES-256",
                    "Hoàn tiền 100% nếu không đạt yêu cầu",
                    "Bảo mật tuyệt đối danh tính khách hàng",
                    "Hỗ trợ giải đáp thắc mắc 24/7",
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{text}</span>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-border/60">
                    <Link
                      href={`/order/create?service=${service.id}`}
                      className={cn(
                        buttonVariants({ size: "default" }),
                        "w-full bg-amber-500 hover:bg-amber-600 text-black font-bold justify-center"
                      )}
                    >
                      Tiến hành tạo đơn
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TiltCard>
          </Reveal>
        </div>
      </div>
    </MarketingPageShell>
  );
}