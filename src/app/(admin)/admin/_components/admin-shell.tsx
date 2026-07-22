"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Receipt,
  CreditCard,
  FileText,
  Settings,
  RotateCcw,
  Layout,
  Menu,
  Flame,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { ADMIN_NAV } from "@/lib/constants";
import { logger } from "@/lib/logger";

const adminIconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  ShoppingBag,
  RotateCcw,
  Package,
  Users,
  Receipt,
  CreditCard,
  Layout,
  FileText,
  Settings,
};

interface AdminUserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

function AdminSidebarContent({
  user,
  collapsed = false,
  onNavigate,
  onLogout,
}: {
  user: AdminUserData | null;
  collapsed?: boolean;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-4 border-b border-slate-800">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Flame className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white">
                G77ADMIN
              </span>
              <span className="text-[10px] uppercase tracking-wider text-amber-500 font-semibold">
                {user?.email || "Admin"}
              </span>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-thin">
        {ADMIN_NAV.map((item) => {
          const Icon = adminIconMap[item.icon] || LayoutDashboard;
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-amber-500/10 text-amber-500 font-semibold"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-slate-800" />

      <div className="p-2">
        <button
          onClick={onLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-900 hover:text-white transition-colors w-full",
            collapsed && "justify-center px-2",
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </div>
  );
}

export function AdminShell({
  user,
  children,
}: {
  user: AdminUserData;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { setTheme } = useTheme();

  // Force dark mode cho admin panel — chạy 1 lần khi mount
  useEffect(() => {
    setTheme("dark");
  }, [setTheme]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.refresh();
        router.push("/admin/login");
      }
    } catch (e) {
      logger.error("admin_logout_failed", {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const adminName = user?.name || "Quản trị viên";

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 dark">
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-slate-800 bg-slate-950 transition-all duration-300 shrink-0",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <AdminSidebarContent
          user={user}
          collapsed={collapsed}
          onLogout={handleLogout}
        />
        <div className="p-2 border-t border-slate-800 bg-slate-950">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full p-2 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
          >
            <ChevronLeft
              className={cn(
                "h-5 w-5 transition-transform",
                collapsed && "rotate-180",
              )}
            />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                className="lg:hidden"
                render={
                  <Button variant="ghost" size="icon" className="text-slate-400">
                    <Menu className="h-5 w-5" />
                  </Button>
                }
              />
              <SheetContent
                side="left"
                className="w-64 p-0 bg-slate-950 border-slate-800"
              >
                <AdminSidebarContent
                  user={user}
                  collapsed={false}
                  onNavigate={() => setMobileOpen(false)}
                  onLogout={handleLogout}
                />
              </SheetContent>
            </Sheet>
            <h2 className="text-lg font-bold tracking-wider">
              Hệ thống quản trị
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
              Chế độ Bảo mật cao
            </span>
            <Avatar className="h-8 w-8 border border-slate-700">
              <AvatarFallback className="bg-amber-500/10 text-amber-500 text-xs font-semibold">
                {adminName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
