import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Home,
  Mail,
  Search,
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoIcon } from "@/components/shared/logo";

export const metadata: Metadata = {
  title: "Không tìm thấy trang",
  description:
    "Trang bạn đang tìm không tồn tại. Quay lại trang chủ hoặc liên hệ với chúng tôi.",
  robots: {
    index: false,
    follow: false,
  },
};

const SHORTCUTS = [
  { icon: Home, label: "Trang chủ", href: "/", desc: "Quay lại trang landing" },
  {
    icon: Search,
    label: "Dịch vụ",
    href: "/services",
    desc: "Khám phá các dịch vụ hiện có",
  },
  {
    icon: Mail,
    label: "Liên hệ",
    href: "/contact",
    desc: "Báo lỗi cho đội ngũ CSKH",
  },
  {
    icon: Compass,
    label: "FAQ",
    href: "/faq",
    desc: "Câu hỏi thường gặp",
  },
];

export default function NotFound() {
  return (
    <main className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden px-4 py-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero" aria-hidden="true" />
      <div
        className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px]"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-[128px]"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-2xl w-full text-center">
        <Badge
          variant="outline"
          className="mb-6 border-amber-500/30 text-amber-500"
        >
          404 - Không tìm thấy
        </Badge>

        <h1 className="text-7xl sm:text-8xl lg:text-9xl font-extrabold tracking-tight mb-2">
          <span className="bg-gradient-to-r from-blue-500 via-amber-400 to-blue-500 bg-clip-text text-transparent">
            404
          </span>
        </h1>

        <div className="flex justify-center mb-4">
          <LogoIcon className="h-12 w-12" />
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
          Trang này đã lạc vào Teyvat
        </h2>
        <p className="text-blue-100/70 text-base sm:text-lg max-w-lg mx-auto mb-10">
          Đường dẫn bạn truy cập không tồn tại hoặc đã được di chuyển. Đừng
          lo — hãy quay lại trang chủ hoặc dùng các liên kết dưới đây.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <Link href="/">
            <Button
              size="lg"
              className="bg-gradient-amber text-black hover:opacity-90 font-bold"
            >
              <Home className="mr-2 h-5 w-5" />
              Về trang chủ
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/contact">
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 font-semibold"
            >
              Báo lỗi
            </Button>
          </Link>
        </div>

        {/* Shortcut grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
          {SHORTCUTS.map((s) => (
            <Link key={s.href} href={s.href} className="block">
              <Card className="glass border-white/10 hover:border-amber-500/40 hover-lift h-full">
                <CardContent className="p-4 text-center">
                  <s.icon className="h-5 w-5 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white mb-0.5">
                    {s.label}
                  </p>
                  <p className="text-[11px] text-blue-100/60 leading-tight">
                    {s.desc}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
