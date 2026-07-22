"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useCallback, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/constants";
import {
  ArrowRight,
  Clock,
  Filter,
  Flame,
  Search,
  Sparkles,
  Star,
  Tag,
  X,
} from "lucide-react";

// ===== Types =====
export interface ServiceListItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  difficulty: string | null;
  estimatedTime: string | null;
  isPopular: boolean;
  category: { id: string; name: string; icon: string };
  priceOptions: Array<{
    id: string;
    name: string;
    price: number;
    originalPrice: number | null;
  }>;
  minPrice: number;
  reviewCount: number;
  orderCount: number;
  avgRating: number;
}

interface ServicesListProps {
  categories: Array<{ id: string; name: string; icon: string }>;
  services: ServiceListItem[];
  difficulties: string[];
  priceBounds: { floor: number; ceiling: number };
  initialFilters: {
    category: string;
    q: string;
    minPrice: string;
    maxPrice: string;
    difficulty: string;
  };
}

const ALL = "all";

// ===== Component =====
export function ServicesList({
  categories,
  services,
  difficulties,
  priceBounds,
  initialFilters,
}: ServicesListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // State filter
  const [category, setCategory] = useState(initialFilters.category);
  const [q, setQ] = useState(initialFilters.q);
  const [minPrice, setMinPrice] = useState<number | "">(
    initialFilters.minPrice ? Number(initialFilters.minPrice) : ""
  );
  const [difficulty, setDifficulty] = useState(initialFilters.difficulty);

  // Range slider value (ép về bounds an toàn)
  const safeFloor = Math.max(0, priceBounds.floor);
  const safeCeiling = Math.max(safeFloor + 1, priceBounds.ceiling);
  const [sliderMax, setSliderMax] = useState<number>(() => {
    const raw = initialFilters.maxPrice;
    const parsed = raw ? Number(raw) : NaN;
    if (!Number.isFinite(parsed) || parsed > safeCeiling) return safeCeiling;
    return parsed;
  });

  // Đồng bộ URL params (chỉ khi state khác initial)
  useEffect(() => {
    const next = new URLSearchParams();
    if (category && category !== ALL) next.set("category", category);
    if (q.trim()) next.set("q", q.trim());
    if (minPrice !== "" && minPrice > 0) next.set("minPrice", String(minPrice));
    if (sliderMax < safeCeiling) next.set("maxPrice", String(sliderMax));
    if (difficulty && difficulty !== ALL) next.set("difficulty", difficulty);

    const currentQs = searchParams.toString();
    const nextQs = next.toString();
    if (currentQs === nextQs) return;

    startTransition(() => {
      router.replace(nextQs ? `/services?${nextQs}` : "/services", {
        scroll: false,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, q, minPrice, sliderMax, difficulty]);

  // Lọc client-side
  const filtered = useMemo(() => {
    const lowerQ = q.trim().toLowerCase();
    const min = minPrice === "" ? 0 : minPrice;
    const max = sliderMax;

    return services.filter((s) => {
      if (category !== ALL && s.category.id !== category) return false;
      if (difficulty !== ALL && s.difficulty !== difficulty) return false;
      if (s.minPrice < min) return false;
      if (s.minPrice > max) return false;
      if (lowerQ) {
        const haystack =
          `${s.name} ${s.description} ${s.category.name}`.toLowerCase();
        if (!haystack.includes(lowerQ)) return false;
      }
      return true;
    });
  }, [services, category, q, minPrice, sliderMax, difficulty]);

  const resetFilters = useCallback(() => {
    setCategory(ALL);
    setQ("");
    setMinPrice("");
    setDifficulty(ALL);
    setSliderMax(safeCeiling);
  }, [safeCeiling]);

  const hasActiveFilter =
    category !== ALL ||
    q.trim() !== "" ||
    minPrice !== "" ||
    sliderMax < safeCeiling ||
    difficulty !== ALL;

  return (
    <main className="relative pt-24 pb-20">
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/15 rounded-full blur-[160px]" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[140px]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6">
            <Flame className="h-4 w-4 text-amber-400" />
            <span className="text-sm text-white/90 font-medium">
              Bảng giá minh bạch · Xử lý nhanh chóng
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-5 tracking-tight">
            Dịch vụ{" "}
            <span className="text-gradient-brand bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">
              Genshin77
            </span>
          </h1>
          <p className="text-lg text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
            Hơn {services.length} dịch vụ chuyên nghiệp. Chọn gói phù hợp và đặt
            đơn chỉ trong vài phút.
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 grid lg:grid-cols-[280px_minmax(0,1fr)] gap-8">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start space-y-5">
          <Card className="border-border/60 bg-card/80 backdrop-blur-md shadow-sm">
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Filter className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-sm">Bộ lọc</h2>
                </div>
                {hasActiveFilter && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={resetFilters}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Đặt lại
                  </Button>
                )}
              </div>

              {/* Search */}
              <div className="space-y-1.5">
                <Label htmlFor="svc-search" className="text-xs">
                  Tìm kiếm
                </Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="svc-search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="La Hoàn, Gacha, Farm..."
                    className="pl-8 h-9"
                  />
                </div>
              </div>

              <Separator />

              {/* Category radio */}
              <div className="space-y-2">
                <Label className="text-xs">Danh mục</Label>
                <div className="space-y-1">
                  <CategoryRadio
                    label="Tất cả"
                    icon="✨"
                    checked={category === ALL}
                    onChange={() => setCategory(ALL)}
                  />
                  {categories.map((c) => (
                    <CategoryRadio
                      key={c.id}
                      label={c.name}
                      icon={c.icon}
                      checked={category === c.id}
                      onChange={() => setCategory(c.id)}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              {/* Difficulty */}
              {difficulties.length > 0 && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="svc-difficulty" className="text-xs">
                      Độ khó
                    </Label>
                    <Select
                      value={difficulty}
                      onValueChange={(val) => {
                        if (val) setDifficulty(val);
                      }}
                    >
                      <SelectTrigger id="svc-difficulty" className="h-9 w-full">
                        <SelectValue placeholder="Tất cả" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>Tất cả</SelectItem>
                        {difficulties.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                </>
              )}

              {/* Price slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Khoảng giá tối đa</Label>
                  <span className="text-xs font-semibold text-primary">
                    {formatPrice(sliderMax)}
                  </span>
                </div>
                <input
                  type="range"
                  min={safeFloor}
                  max={safeCeiling}
                  step={Math.max(10_000, Math.round((safeCeiling - safeFloor) / 50))}
                  value={sliderMax}
                  onChange={(e) => setSliderMax(Number(e.target.value))}
                  className="w-full accent-primary"
                  aria-label="Giá tối đa"
                />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{formatPrice(safeFloor)}</span>
                  <span>{formatPrice(safeCeiling)}</span>
                </div>
              </div>

              <Separator />

              {/* Min price input */}
              <div className="space-y-1.5">
                <Label htmlFor="svc-min-price" className="text-xs">
                  Giá tối thiểu (tuỳ chọn)
                </Label>
                <Input
                  id="svc-min-price"
                  type="number"
                  min={0}
                  value={minPrice}
                  onChange={(e) =>
                    setMinPrice(
                      e.target.value === "" ? "" : Math.max(0, Number(e.target.value))
                    )
                  }
                  placeholder="0"
                  className="h-9"
                />
              </div>
            </CardContent>
          </Card>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground mb-1.5">
              💡 Không tìm thấy dịch vụ phù hợp?
            </p>
            Liên hệ đội ngũ để được tư vấn gói tùy chỉnh riêng cho nhu cầu của
            bạn.
          </div>
        </aside>

        {/* Grid */}
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-muted-foreground">
              Hiển thị{" "}
              <span className="font-semibold text-foreground">
                {filtered.length}
              </span>{" "}
              / {services.length} dịch vụ
            </p>
            {hasActiveFilter && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {category !== ALL && (
                  <ActiveChip onClear={() => setCategory(ALL)}>
                    {categories.find((c) => c.id === category)?.name ?? category}
                  </ActiveChip>
                )}
                {q.trim() && (
                  <ActiveChip onClear={() => setQ("")}>
                    Tìm: {q.trim()}
                  </ActiveChip>
                )}
                {difficulty !== ALL && (
                  <ActiveChip onClear={() => setDifficulty(ALL)}>
                    Độ khó: {difficulty}
                  </ActiveChip>
                )}
                {(minPrice !== "" || sliderMax < safeCeiling) && (
                  <ActiveChip
                    onClear={() => {
                      setMinPrice("");
                      setSliderMax(safeCeiling);
                    }}
                  >
                    Giá: {minPrice === "" ? formatPrice(0) : formatPrice(minPrice)}{" "}
                    → {formatPrice(sliderMax)}
                  </ActiveChip>
                )}
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Không tìm thấy dịch vụ phù hợp"
              description="Thử điều chỉnh bộ lọc hoặc đặt lại để xem tất cả dịch vụ."
              action={
                <Button variant="outline" onClick={resetFilters}>
                  Đặt lại bộ lọc
                </Button>
              }
            />
          ) : (
            <motion.div
              layout
              className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((s) => (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ServiceCard service={s} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>
    </main>
  );
}

// ===== Sub-components =====

function CategoryRadio({
  label,
  icon,
  checked,
  onChange,
}: {
  label: string;
  icon: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors",
        checked
          ? "bg-primary/10 text-primary font-semibold"
          : "hover:bg-muted text-foreground/80"
      )}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="accent-primary"
      />
      <span className="text-base leading-none">{icon}</span>
      <span className="truncate">{label}</span>
    </label>
  );
}

function ActiveChip({
  children,
  onClear,
}: {
  children: React.ReactNode;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-1 font-medium">
      {children}
      <button
        type="button"
        onClick={onClear}
        className="hover:bg-primary/20 rounded-full p-0.5"
        aria-label="Bỏ lọc"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function ServiceCard({ service }: { service: ServiceListItem }) {
  const showStars = service.reviewCount > 0;
  const firstOption = service.priceOptions[0];

  return (
    <Link
      href={`/services/${service.id}`}
      className="group block h-full rounded-xl overflow-hidden border border-border/60 bg-card/80 backdrop-blur-md shadow-sm hover:bg-card/95 transition-all hover-lift"
    >
      <Card className="h-full border-0 bg-transparent shadow-none flex flex-col justify-between">
        <div>
          <div className="relative aspect-[16/10] bg-muted overflow-hidden">
            {service.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={service.imageUrl}
                alt={service.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-amber-500/20 flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-white/30" />
              </div>
            )}

            {/* Top badges */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              {service.isPopular && (
                <Badge className="bg-amber-500 hover:bg-amber-500 text-black font-bold text-[10px]">
                  <Flame className="mr-1 h-3 w-3" />
                  Phổ biến
                </Badge>
              )}
              <Badge
                variant="outline"
                className="bg-black/50 backdrop-blur-sm text-white border-white/20 text-[10px]"
              >
                <span className="mr-1">{service.category.icon}</span>
                {service.category.name}
              </Badge>
            </div>
          </div>

          <CardContent className="p-5 flex flex-col gap-3">
            <h3 className="text-lg font-bold leading-tight line-clamp-2 min-h-[3rem] flex items-center group-hover:text-primary transition-colors">
              {service.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.5rem]">
              {service.description}
            </p>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground min-h-[1.5rem]">
              {showStars && (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-foreground">
                    {service.avgRating.toFixed(1)}
                  </span>
                  <span>({service.reviewCount})</span>
                </span>
              )}
              {service.estimatedTime && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {service.estimatedTime}
                </span>
              )}
              {service.difficulty && (
                <Badge variant="secondary" className="text-[10px]">
                  <Tag className="mr-1 h-3 w-3" />
                  {service.difficulty}
                </Badge>
              )}
            </div>
          </CardContent>
        </div>

        <div className="px-5 pb-5">
          <Separator className="mb-3" />

          {/* Price + CTA */}
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                Giá từ
              </p>
              <p className="text-lg font-extrabold text-amber-500">
                {firstOption
                  ? formatCurrency(firstOption.price)
                  : formatCurrency(0)}
              </p>
            </div>
            <span className="magnetic-cta inline-flex items-center justify-center gap-1 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
              Đặt dịch vụ
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// ===== Local helper =====
function formatPrice(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}tr`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return formatCurrency(value);
}