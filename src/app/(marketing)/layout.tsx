import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { GenshinBackground } from "@/components/marketing/GenshinBackground";
import { DecorationReveal } from "@/components/marketing/DecorationReveal";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Ảnh nền Genshin Impact cố định — hiện rõ khi cuộn xuống */}
      <GenshinBackground />
      {/* Decorations cũ (gradient/mesh/shapes) — mờ đi khi cuộn ↓ */}
      <DecorationReveal />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
