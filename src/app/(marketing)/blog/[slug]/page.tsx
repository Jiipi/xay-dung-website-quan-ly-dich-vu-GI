import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Reveal } from "@/components/animations/Reveal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatShortDate } from "@/lib/constants";
import { ArrowLeft, Calendar, User as UserIcon, Sparkles, Share2, Tag as TagIcon, ArrowRight } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await db.article.findUnique({
    where: { slug },
  });

  if (!article) {
    return { title: "Bài viết không tồn tại" };
  }

  return {
    title: `${article.title} | Genshin77 Blog`,
    description: article.excerpt || article.title,
    openGraph: {
      title: article.title,
      description: article.excerpt || article.title,
      type: "article",
      publishedTime: article.publishedAt?.toISOString(),
      images: article.coverImage ? [{ url: article.coverImage }] : [],
    },
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = await db.article.findUnique({
    where: { slug },
    include: {
      author: {
        select: { name: true, email: true },
      },
    },
  });

  if (!article || article.status !== "PUBLISHED") {
    notFound();
  }

  // Related articles
  const relatedArticles = await db.article.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: article.id },
    },
    take: 3,
    orderBy: { publishedAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  return (
    <MarketingPageShell className="pt-28 pb-20 px-4">
      {/* Back button */}
      <div className="mx-auto max-w-4xl mb-8">
        <Link
          href="/blog"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 text-muted-foreground hover:text-foreground")}
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách Blog
        </Link>
      </div>

      <article className="mx-auto max-w-4xl">
        {/* Header */}
        <section className="mb-10 text-center sm:text-left">
          <Reveal>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-4">
              {article.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <TagIcon className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight mb-6 text-balance leading-tight">
              {article.title}
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 text-sm text-muted-foreground pb-6 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-amber-500/20 text-amber-500 text-xs font-bold">
                    {article.author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">{article.author.name}</span>
              </div>
              {article.publishedAt && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-amber-500" />
                  <span>{formatShortDate(article.publishedAt)}</span>
                </div>
              )}
            </div>
          </Reveal>
        </section>

        {/* Cover Image if present */}
        {article.coverImage && (
          <Reveal delay={0.25}>
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl mb-10 border border-border/50 shadow-2xl">
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                priority
                className="object-cover"
              />
            </div>
          </Reveal>
        )}

        {/* Main Content */}
        <Reveal delay={0.3}>
          <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-xl mb-12">
            <CardContent className="p-6 sm:p-10 text-foreground leading-relaxed prose dark:prose-invert max-w-none">
              {article.excerpt && (
                <p className="text-lg font-medium text-amber-500/90 border-l-4 border-amber-500 pl-4 py-1 mb-8 italic">
                  {article.excerpt}
                </p>
              )}
              <div className="whitespace-pre-line text-base text-foreground/90 space-y-4">
                {article.content}
              </div>
            </CardContent>
          </Card>
        </Reveal>

        {/* CTA banner inside article */}
        <Reveal delay={0.35}>
          <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-card to-card p-6 sm:p-8 mb-16 rounded-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
              <div>
                <h3 className="text-xl font-bold font-heading mb-2">Cần hỗ trợ cày thuê Genshin Impact uy tín?</h3>
                <p className="text-sm text-muted-foreground max-w-lg">
                  Đội ngũ Booster chuyên nghiệp tại Genshin77 luôn sẵn sàng giúp bạn chinh phục La Hoàn 36 sao và farm nguyên liệu nhanh chóng.
                </p>
              </div>
              <Link
                href="/services"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-amber-500 hover:bg-amber-600 text-black font-extrabold shrink-0"
                )}
              >
                Khám phá dịch vụ
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </Card>
        </Reveal>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="space-y-6">
            <h2 className="font-heading text-2xl font-bold tracking-tight">Bài viết liên quan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((rel) => (
                <Link key={rel.id} href={`/blog/${rel.slug}`} className="group block">
                  <Card className="h-full border-border/50 bg-card/50 hover:border-amber-500/50 hover:bg-card transition-all duration-300">
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                      <div>
                        <h4 className="font-bold text-base group-hover:text-amber-500 transition-colors line-clamp-2 mb-2">
                          {rel.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {rel.excerpt}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center justify-between pt-3 border-t border-border/40">
                        <span>{rel.author.name}</span>
                        {rel.publishedAt && <span>{formatShortDate(rel.publishedAt)}</span>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </MarketingPageShell>
  );
}
