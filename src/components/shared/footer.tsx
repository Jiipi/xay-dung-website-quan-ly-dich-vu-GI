import Link from "next/link";
import { Flame } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  "Dịch vụ": [
    { label: "Bảng giá", href: "/services" },
    { label: "La Hoàn Thâm Cảnh", href: "/services#endgame" },
    { label: "Farm & Boss", href: "/services#farm" },
    { label: "Gói tùy chỉnh", href: "/services#custom" },
  ],
  "Hỗ trợ": [
    { label: "FAQ", href: "/faq" },
    { label: "Liên hệ", href: "/contact" },
    { label: "Hướng dẫn nạp tiền", href: "/faq#deposit" },
  ],
  "Chính sách": [
    { label: "Điều khoản dịch vụ", href: "/terms" },
    { label: "Chính sách bảo mật", href: "/privacy" },
    { label: "Chính sách hoàn tiền", href: "/refund" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/40 backdrop-blur-md text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Flame className="h-7 w-7 text-amber-500" />
              <span className="text-lg font-bold text-white">
                Genshin<span className="text-amber-500">77</span>
              </span>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed mb-4">
              Nền tảng dịch vụ Genshin Impact chuyên nghiệp, uy tín và bảo mật.
              Đồng hành cùng bạn chinh phục Teyvat.
            </p>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-emerald-400 font-medium">
                Đang hoạt động 24/7
              </span>
            </div>
          </div>

          {/* Link groups */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-white/90 mb-4 uppercase tracking-wider">
                {title}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-amber-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-10 bg-slate-800" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Genshin77. Không liên kết với HoYoverse.
            Genshin Impact™ là thương hiệu của HoYoverse.
          </p>
          <p className="text-xs text-slate-500">
            Sản phẩm này không được HoYoverse xác nhận và không phản ánh quan điểm
            của HoYoverse.
          </p>
        </div>
      </div>
    </footer>
  );
}
