import type { Metadata } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

import { CTASection } from "@/components/marketing/CTASection";
import { FAQAccordion } from "@/components/marketing/FAQAccordion";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { HeroSection, type HeroStat } from "@/components/marketing/HeroSection";
import { LogoCloud } from "@/components/marketing/LogoCloud";
import { ScrollProgressBar } from "@/components/animations/ScrollProgressBar";
import { StatBar, type StatItem } from "@/components/marketing/StatBar";

export const dynamic = "force-dynamic";

// ===== STATIC CONTENT =====

const HERO_BADGE = "Dịch vụ Game uy tín #1 Việt Nam";

const HERO_TITLE = "Cày Thuê & Dịch Vụ Game Chuyên Nghiệp";

const HERO_DESCRIPTION =
  "Nền tảng quản lý cày thuê Genshin Impact hàng đầu với mật khẩu mã hóa AES-256, nạp tiền tự động qua QR và ví sổ cái minh bạch.";

const HERO_STATS: HeroStat[] = [
  { value: 1000, suffix: "+", label: "Đơn hoàn thành", icon: "trending" },
  { value: 500, suffix: "+", label: "Khách hàng", icon: "users" },
  { value: 4.9, decimals: 1, label: "Đánh giá", icon: "star" },
  { value: 24, suffix: "/7", label: "Hỗ trợ", icon: "zap" },
];

const LOGOS = [
  "HOYOVERSE",
  "GENSHIN",
  "STARRAIL",
  "TEYVAT",
  "MONDSTADT",
  "LIYUE",
  "INAZUMA",
  "SNEZHNAYA",
];

const FEATURES = [
  {
    iconName: "swords" as const,
    title: "Booster chuyên nghiệp",
    description:
      "Đội ngũ booster tuyển chọn, thành thạo meta hiện tại và tối ưu đội hình.",
  },
  {
    iconName: "timer" as const,
    title: "Giao hàng nhanh",
    description:
      "La Hoàn 2-4 giờ, Roll chỉ 15-30 phút. Cam kết thời gian rõ ràng.",
  },
  {
    iconName: "badge-check" as const,
    title: "Bảo hành đầy đủ",
    description:
      "Không hoàn thành = hoàn tiền 100%. Ảnh chứng minh kết quả cho mỗi đơn.",
  },
  {
    iconName: "lock" as const,
    title: "An toàn tài khoản",
    description:
      "Mã hóa AES-256. Mật khẩu chỉ hiển thị tạm thời, ghi log mọi lần truy cập.",
  },
  {
    iconName: "user-check" as const,
    title: "Hỗ trợ 24/7",
    description:
      "Chat trực tiếp với admin/booster ngay trong đơn hàng, phản hồi trong vài phút.",
  },
  {
    iconName: "wallet" as const,
    title: "Giá minh bạch",
    description:
      "Ví nội bộ với sổ cái bất biến. Mọi giao dịch đều có thể tra soát.",
  },
];

const BIG_STATS: StatItem[] = [
  { value: 1000, suffix: "+", label: "Đơn hàng đã hoàn thành", icon: "trending" },
  { value: 500, suffix: "+", label: "Khách hàng tin tưởng", icon: "users" },
  { value: 98, suffix: "%", label: "Tỷ lệ hài lòng", icon: "award" },
  { value: 24, label: "Hỗ trợ trực tuyến", icon: "shield" },
];

const FAQS = [
  {
    question: "Genshin77 là gì?",
    answer:
      "Genshin77 là nền tảng dịch vụ Genshin Impact chuyên nghiệp, kết nối game thủ với đội ngũ booster chất lượng cao. Chúng tôi cung cấp La Hoàn, Farm, Roll hộ, Mở Map, Event và nhiều dịch vụ khác.",
  },
  {
    question: "Tài khoản game của tôi có bảo mật không?",
    answer:
      "Thông tin đăng nhập được mã hóa AES-256-GCM. Mật khẩu chỉ admin/booster cần thiết mới thấy, mọi lần truy cập đều được ghi log. Sau khi đơn hoàn tất, dữ liệu tự động được xóa.",
  },
  {
    question: "Nạp tiền vào ví bằng cách nào?",
    answer:
      "Hỗ trợ nạp qua QR Code ngân hàng (PayOS/VietQR). Hệ thống xác nhận tự động trong vài giây.",
  },
  {
    question: "Nếu không hài lòng, được hoàn tiền không?",
    answer:
      "Có. Nếu dịch vụ không hoàn thành đúng cam kết, bạn được hoàn 100% vào ví sổ cái qua tính năng Khiếu nại.",
  },
  {
    question: "Mỗi dịch vụ mất bao lâu?",
    answer:
      "La Hoàn 2-4 giờ, Roll 15-30 phút, Farm 1-2 tuần, Mở Map 4-8 giờ/1 khu vực. Thời gian dự kiến hiển thị rõ ở mỗi dịch vụ.",
  },
];

// ===== METADATA =====

export const metadata: Metadata = {
  title: "Genshin77 - Dịch vụ Genshin Impact chuyên nghiệp #1 Việt Nam",
  description:
    "Dịch vụ Genshin Impact chuyên nghiệp, bảo mật và minh bạch: La Hoàn Thâm Cảnh, Farm Thánh Di Vật, Roll nhân vật, Mở Map, Event.",
  openGraph: {
    title: "Genshin77 - Dịch vụ Genshin Impact chuyên nghiệp #1 Việt Nam",
    description: "Dịch vụ Genshin Impact bảo mật và minh bạch. La Hoàn, Farm, Roll, Mở Map.",
    type: "website",
    locale: "vi_VN",
  },
};

// ===== SERVER SECTIONS (data-driven) =====

async function TestimonialsSection() {
  const reviews = await db.review.findMany({
    where: { status: "APPROVED" },
    include: { user: true, service: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  if (reviews.length === 0) return null;

  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-flex rounded-full border border-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-500">
            Đánh giá thực tế
          </span>
          <h2 className="mb-4 font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Khách hàng nói gì về Genshin77?
          </h2>
          <p className="text-base text-pretty text-muted-foreground sm:text-lg">
            Đánh giá thật 100% từ những khách hàng đã hoàn thành đơn trên hệ thống
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <article
              key={r.id}
              className="group relative h-full overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all hover-lift"
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-1 bg-gradient-brand opacity-0 transition-opacity group-hover:opacity-100"
              />
              <div className="mb-4 flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={
                      i < r.rating
                        ? "text-amber-400"
                        : "text-muted/50"
                    }
                    aria-hidden
                  >
                    {"\u2605"}
                  </span>
                ))}
              </div>
              <p className="mb-5 text-sm leading-relaxed text-foreground/85">
                &ldquo;{r.content}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-gradient-brand text-xs font-bold text-white">
                  {r.user.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">{r.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.service.name}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== PAGE =====

export default async function LandingPage() {
  return (
    <>
      <ScrollProgressBar position="top" />

      <HeroSection
        badge={HERO_BADGE}
        title={HERO_TITLE}
        description={HERO_DESCRIPTION}
        ctaPrimary={{ label: "Khám phá Dịch vụ", href: "/services" }}
        ctaSecondary={{ label: "Xem Bảng Giá", href: "/pricing" }}
        stats={HERO_STATS}
      />

        <LogoCloud
          title="Được tin tưởng bởi cộng đồng"
          logos={LOGOS.map((name) => ({ name }))}
        />

        <FeatureGrid
          heading="Tại sao chọn Genshin77?"
          subheading="Quy trình cày thuê chuyên nghiệp, cam kết bảo mật và trải nghiệm tuyệt đối cho game thủ."
          features={FEATURES}
        />

        <StatBar stats={BIG_STATS} />

        <TestimonialsSection />

        <FAQAccordion
          heading="Câu hỏi thường gặp"
          subheading="Giải đáp những thắc mắc phổ nhất về Genshin77"
          items={FAQS}
        />

        <CTASection
          heading="Sẵn sàng trải nghiệm?"
          description="Đăng ký ngay và nhận thưởng 10% giá trị nạp lần đầu."
          primary={{ label: "Bắt đầu ngay", href: "/register" }}
          secondary={{ label: "Xem dịch vụ", href: "/services" }}
          illustration="sword"
        />
    </>
  );
}
