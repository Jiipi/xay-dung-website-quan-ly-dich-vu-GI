import type { Metadata } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

import { ServicesList } from "./_components/services-list";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";

export const metadata: Metadata = {
  title: "Dịch vụ",
  description:
    "Danh sách dịch vụ Genshin Impact chuyên nghiệp: La Hoàn Thâm Cảnh, Farm, Gacha, Map, Sự kiện và Tùy chỉnh. Giá minh bạch, xử lý nhanh.",
  openGraph: {
    title: "Dịch vụ | Genshin77",
    description:
      "Danh sách dịch vụ Genshin Impact chuyên nghiệp với giá minh bạch và xử lý nhanh.",
    type: "website",
    images: [
      {
        url: "/og-services.png",
        width: 1200,
        height: 630,
        alt: "Dịch vụ Genshin77",
      },
    ],
  },
};

type SearchParams = Promise<{
  category?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  difficulty?: string;
}>;

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  let categories: Array<{ id: string; name: string; icon: string }> = [];
  let services: any[] = [];

  try {
    const [fetchedCats, fetchedSvcs] = await Promise.all([
      db.serviceCategory.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, icon: true },
      }),
      db.service.findMany({
        where: { isActive: true },
        orderBy: [{ isPopular: "desc" }, { name: "asc" }],
        include: {
          category: { select: { id: true, name: true, icon: true } },
          priceOptions: {
            orderBy: { price: "asc" },
            select: { id: true, name: true, price: true, originalPrice: true },
          },
          reviews: {
            where: { status: "APPROVED" },
            select: { rating: true },
          },
          _count: {
            select: {
              reviews: { where: { status: "APPROVED" } },
              orders: true,
            },
          },
        },
      }),
    ]);
    categories = fetchedCats.map((c) => ({ ...c, icon: c.icon || "Sparkles" }));
    services = fetchedSvcs;
  } catch (error) {
    console.error("[ServicesPage] DB query error:", error);
  }

  // Chuẩn hoá dữ liệu truyền cho client component
  const initialFilters = {
    category: params.category ?? "all",
    q: params.q ?? "",
    minPrice: params.minPrice ?? "",
    maxPrice: params.maxPrice ?? "",
    difficulty: params.difficulty ?? "all",
  };

  const normalizedServices = services.map((s) => {
    const reviewCount = s._count.reviews;
    const orderCount = s._count.orders;
    const avgRating =
      reviewCount > 0
        ? s.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviewCount
        : 0;
    const minPrice =
      s.priceOptions.length > 0
        ? Math.min(...s.priceOptions.map((p: { price: number }) => p.price))
        : 0;

    return {
      id: s.id,
      name: s.name,
      description: s.description,
      imageUrl: s.imageUrl ?? null,
      difficulty: s.difficulty ?? null,
      estimatedTime: s.estimatedTime ?? null,
      isPopular: s.isPopular,
      category: {
        id: s.category.id,
        name: s.category.name,
        icon: s.category.icon,
      },
      priceOptions: s.priceOptions,
      minPrice,
      reviewCount,
      orderCount,
      avgRating,
    };
  });

  // Tính range giá min/max để hiển thị slider
  const allPrices = normalizedServices.map((s) => s.minPrice).filter((n) => n > 0);
  const priceFloor = allPrices.length > 0 ? Math.floor(Math.min(...allPrices)) : 0;
  const priceCeiling =
    allPrices.length > 0 ? Math.ceil(Math.max(...allPrices)) : 1_000_000;

  // Danh sách độ khó unique từ data
  const difficulties = Array.from(
    new Set(
      normalizedServices
        .map((s) => s.difficulty)
        .filter((d): d is string => Boolean(d))
    )
  );

  return (
    <MarketingPageShell className="pt-0">
      <ServicesList
        categories={categories}
        services={normalizedServices}
        difficulties={difficulties}
        priceBounds={{ floor: priceFloor, ceiling: priceCeiling }}
        initialFilters={initialFilters}
      />
    </MarketingPageShell>
  );
}