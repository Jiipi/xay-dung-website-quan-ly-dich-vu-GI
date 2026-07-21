import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { formatShortDate } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { FloatingShapes } from "@/components/animations/FloatingShapes";
import { GradientText } from "@/components/animations/GradientText";
import { MeshGradient } from "@/components/animations/MeshGradient";
import { NoiseOverlay } from "@/components/animations/NoiseOverlay";
import { Reveal } from "@/components/animations/Reveal";
import { TiltCard } from "@/components/animations/TiltCard";
import { staggerContainer, staggerItem } from "@/lib/motion";

const PAGE_SIZE = 9;

type SearchParams = Promise<{ page?: string }>;

type ArticleListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  tags: string[];
  publishedAt: Date | null;
  author: { name: string };
};

export const metadata: Metadata = {
  title: "Blog & Hướng dẫn",
  description:
    "Tổng hợp bài viết, mẹo, hướng dẫn và cập nhật mới nhất về Genshin Impact từ đội ngũ Genshin77.",
  openGraph: {
    title: "Blog & Hướng dẫn | Genshin77",
    description:
      "Tổng hợp bài viết, mẹo, hướng dẫn và cập nhật mới nhất về Genshin Impact.",
    type: "website",
    images: [
      {
        url: "/og-blog.png",
        width: 1200,
        height: 630,
        alt: "Genshin77 Blog",
      },
    ],
  },
};

/** Ước lượng thời gian đọc (phút) dựa trên số từ. ~200 từ/phút cho tiếng Việt. */
function estimateReadingTime(content: string | null | undefined): number {
  if (!content) return 1;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params.page) || 1);

  const where = { status: "PUBLISHED" as const };

  const [total, articles, contentRows] = await Promise.all([
    db.article.count({ where }),
    db.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        tags: true,
        publishedAt: true,
        author: { select: { name: true } },
      },
    }),
    db.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, content: true },
    }),
  ]);

  // Map id -> reading time để tránh N+1 query khi render.
  const readingTimeMap = new Map<string, number>(
    contentRows.map((row) => [row.id, estimateReadingTime(row.content)])
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const featured = articles[0];
  const rest = articles.slice(1);

  const buildPageHref = (page: number) =>
    page <= 1 ? "/blog" : `/blog?page=${page}`;

  return (
    <main className="relative z-[1] overflow-hidden pt-24 pb-20">
      {/* Header */}
      <section className="relative overflow-hidden">
        <FloatingShapes className="absolute inset-0 opacity-30" aria-hidden />
        <MeshGradient className="absolute inset-0" count={3} intensity={0.3} aria-hidden />
        <NoiseOverlay opacity={0.03} aria-hidden />

        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
          <Reveal>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-white/90">
                Cập nhật liên tục mỗi tuần
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="mb-5 font-heading text-4xl font-extrabold tracking-tight text-balance text-white sm:text-5xl lg:text-6xl">
              Blog &amp;{" "}
              <GradientText gradient="linear-gradient(135deg,#60a5fa 0%,#fbbf24 100%)">
                Hướng dẫn
              </GradientText>
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mx-auto max-w-2xl text-base text-pretty text-blue-100/80 sm:text-lg">
              Mẹo chơi, cập nhật meta, hướng dẫn build và những kiến thức hữu
              ích giúp bạn chinh phục Teyvat hiệu quả hơn.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Articles */}
      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6">
        {articles.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Chưa có bài viết nào"
            description="Đội ngũ biên tập đang chuẩn bị nội dung chất lượng. Hãy quay lại sau nhé!"
          />
        ) : (
          <>
            {featured ? (
              <Reveal>
                <FeaturedArticleCard
                  article={featured}
                  readingTime={readingTimeMap.get(featured.id) ?? 1}
                />
              </Reveal>
            ) : null}

            {rest.length > 0 ? (
              <motion.div
                className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                variants={staggerContainer}
                initial="hidden"
                viewport={{ once: true, margin: "-10% 0px" }}
                whileInView="visible"
              >
                {rest.map((article) => (
                  <motion.div key={article.id} variants={staggerItem}>
                    <ArticleCard
                      article={article}
                      readingTime={readingTimeMap.get(article.id) ?? 1}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : null}

            {totalPages > 1 ? (
              <Reveal className="mt-14">
                <Separator className="mb-6" />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Trang{" "}
                    <span className="font-semibold text-foreground">
                      {currentPage}
                    </span>{" "}
                    / {totalPages}
                    <span className="hidden sm:inline"> · {total} bài viết</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasPrev}
                      className={cn(!hasPrev && "pointer-events-none opacity-50")}
                      render={<Link href={buildPageHref(currentPage - 1)} />}
                    >
                      <ArrowLeft className="mr-1 h-4 w-4" />
                      Trước
                    </Button>
                    <Button
                      size="sm"
                      disabled={!hasNext}
                      className={cn(
                        "bg-gradient-brand text-white shadow-md hover:opacity-90",
                        !hasNext && "pointer-events-none opacity-50"
                      )}
                      render={<Link href={buildPageHref(currentPage + 1)} />}
                    >
                      Sau
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Reveal>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}

function FeaturedArticleCard({
  article,
  readingTime,
}: {
  article: ArticleListItem;
  readingTime: number;
}) {
  return (
    <TiltCard maxRotation={3} className="block">
      <Link
        href={`/blog/${article.slug}`}
        className="tilt-card group block overflow-hidden rounded-2xl border border-border/50 bg-card hover-lift"
      >
        <div className="grid lg:grid-cols-2">
          <div className="relative aspect-[16/10] overflow-hidden bg-muted lg:aspect-auto lg:min-h-[320px]">
            {article.coverImage ? (
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                priority
              />
            ) : (
              <FeaturedPlaceholder />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent lg:bg-gradient-to-r" />
            <Badge className="absolute left-4 top-4 bg-amber-500 font-semibold text-black hover:bg-amber-500">
              <Sparkles className="mr-1 h-3 w-3" />
              Mới nhất
            </Badge>
          </div>

          <div className="flex flex-col justify-center p-6 lg:p-10">
            {article.tags.length > 0 ? (
              <div className="mb-4 flex flex-wrap gap-1.5">
                {article.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
            <h2 className="mb-4 text-2xl font-bold leading-tight transition-colors group-hover:text-primary lg:text-3xl">
              {article.title}
            </h2>
            {article.excerpt ? (
              <p className="mb-6 line-clamp-3 leading-relaxed text-muted-foreground">
                {article.excerpt}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <UserIcon className="h-4 w-4" />
                {article.author.name}
              </span>
              {article.publishedAt ? (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatShortDate(article.publishedAt)}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />~ {readingTime} phút đọc
              </span>
            </div>

            <div className="mt-6 inline-flex items-center text-sm font-semibold text-primary transition-transform group-hover:translate-x-1">
              Đọc tiếp
              <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          </div>
        </div>
      </Link>
    </TiltCard>
  );
}

function ArticleCard({
  article,
  readingTime,
}: {
  article: ArticleListItem;
  readingTime: number;
}) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group block h-full rounded-xl overflow-hidden border border-border/50 bg-card hover-lift"
    >
      <Card className="h-full border-0 bg-transparent shadow-none">
        <div className="relative aspect-[16/10] bg-muted overflow-hidden">
          {article.coverImage ? (
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <CardPlaceholder />
          )}
        </div>

        <CardHeader className="pb-2">
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {article.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <CardTitle className="text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          {article.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-4">
              {article.excerpt}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <UserIcon className="h-3.5 w-3.5" />
              {article.author.name}
            </span>
            {article.publishedAt && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatShortDate(article.publishedAt)}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />~ {readingTime} phút
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function FeaturedPlaceholder() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-amber-500/30 flex items-center justify-center">
      <Sparkles className="h-16 w-16 text-white/30" />
    </div>
  );
}

function CardPlaceholder() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-amber-500/20 flex items-center justify-center">
      <Sparkles className="h-10 w-10 text-white/30" />
    </div>
  );
}