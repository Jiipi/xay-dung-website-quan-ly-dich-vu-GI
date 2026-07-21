import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto w-full">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
