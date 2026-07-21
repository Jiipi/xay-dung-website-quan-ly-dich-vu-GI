import Link from "next/link";
import { Swords, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export default async function BoosterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const user = token ? await verifyToken(token) : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header riêng cho Booster */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/booster" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Swords className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg tracking-tight">
                Genshin77 <span className="text-amber-500">Booster</span>
              </span>
            </Link>
            <Badge variant="outline" className="border-amber-500/30 text-amber-500 text-xs px-2.5 py-0.5">
              Booster Portal
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-bold text-foreground">
                {user?.name || "Booster"}
              </span>
              <span className="text-xs text-muted-foreground">
                {user?.email}
              </span>
            </div>
            <form action="/api/auth/logout" method="POST">
              <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground hover:text-destructive gap-1.5">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
