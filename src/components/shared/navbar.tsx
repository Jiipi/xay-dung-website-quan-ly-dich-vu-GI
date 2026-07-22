"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Menu,
  Flame,
  Wallet,
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  User as UserIcon,
  Bell,
  LogOut,
  Plus,
  Shield,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/constants";

const navLinks = [
  { label: "Trang chủ", href: "/" },
  { label: "Dịch vụ", href: "/services" },
  { label: "FAQ", href: "/faq" },
  { label: "Liên hệ", href: "/contact" },
];

const accountLinks = [
  { label: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { label: "Đơn hàng của tôi", href: "/dashboard/orders", icon: ShoppingBag },
  { label: "Nạp tiền", href: "/dashboard/deposit", icon: Wallet },
  { label: "Lịch sử ví", href: "/dashboard/wallet", icon: Receipt },
  { label: "Hồ sơ", href: "/dashboard/profile", icon: UserIcon },
  { label: "Thông báo", href: "/dashboard/notifications", icon: Bell },
];

interface NavUser {
  name: string;
  email: string;
  role: string;
  balance: number;
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<NavUser | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Kiểm tra đăng nhập; kiểm lại khi đổi route (vd sau khi đăng nhập chuyển về "/")
  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active) setUser(d?.success ? d.user : null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pathname]);

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.unreadCount !== undefined) {
            setUnreadCount(data.unreadCount);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      toast.success("Đã đăng xuất");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Lỗi khi đăng xuất");
    }
  };

  const isCustomer = user?.role === "CUSTOMER";
  const isAdmin = user?.role === "ADMIN";

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Flame className="h-8 w-8 text-amber-500 transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Genshin<span className="text-amber-500">77</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  pathname === link.href
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
                {pathname === link.href && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 bg-primary/10 rounded-lg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />

            {!user && (
              <>
                <Link
                  href="/login"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
                  )}
                >
                  Đăng ký
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link
                  href="/admin"
                  className={cn(
                    buttonVariants({ size: "sm", variant: "outline" }),
                    "gap-1.5"
                  )}
                >
                  <Shield className="h-4 w-4" /> Trang quản trị
                </Link>
                <Button size="sm" variant="ghost" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}

            {user && (
              <Link
                href="/dashboard/notifications"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "relative h-9 w-9"
                )}
                title="Thông báo"
              >
                <Bell className="h-4 w-4 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                )}
              </Link>
            )}

            {isCustomer && (
              <>
                <div className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-full">
                  <Wallet className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold">
                    {formatCurrency(user!.balance)}
                  </span>
                </div>
                <Link
                  href="/order/create"
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold"
                  )}
                >
                  <Plus className="h-4 w-4" /> Tạo đơn
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-muted transition-colors outline-none">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {user!.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <div className="px-2 py-2">
                      <p className="text-sm font-semibold truncate">
                        {user!.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user!.email}
                      </p>
                      <p className="text-xs text-amber-500 font-semibold mt-1">
                        Số dư: {formatCurrency(user!.balance)}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    {accountLinks.map((item) => (
                      <DropdownMenuItem
                        key={item.href}
                        onClick={() => router.push(item.href)}
                      >
                        <item.icon className="h-4 w-4" /> {item.label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" /> Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger render={<Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>} />
              <SheetContent side="right" className="w-80 overflow-y-auto">
                <div className="flex flex-col gap-6 mt-8">
                  <div className="flex items-center gap-2">
                    <Flame className="h-7 w-7 text-amber-500" />
                    <span className="text-lg font-bold">Genshin<span className="text-amber-500">77</span></span>
                  </div>

                  {isCustomer && (
                    <div className="rounded-xl border bg-muted/30 p-3">
                      <p className="text-sm font-semibold truncate">{user!.name}</p>
                      <p className="text-xs text-amber-500 font-semibold mt-0.5">Số dư: {formatCurrency(user!.balance)}</p>
                    </div>
                  )}

                  <nav className="flex flex-col gap-1">
                    {navLinks.map((link) => (
                      <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className={cn("px-4 py-3 rounded-lg text-sm font-medium transition-colors", pathname === link.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                        {link.label}
                      </Link>
                    ))}
                  </nav>

                  {isCustomer && (
                    <nav className="flex flex-col gap-1 border-t pt-4">
                      <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tài khoản</p>
                      {accountLinks.map((item) => (
                        <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                          <item.icon className="h-4 w-4" /> {item.label}
                        </Link>
                      ))}
                    </nav>
                  )}

                  <div className="flex flex-col gap-3 pt-4 border-t">
                    {!user && (
                      <>
                        <Link href="/login" onClick={() => setMobileOpen(false)} className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center")}>Đăng nhập</Link>
                        <Link href="/register" onClick={() => setMobileOpen(false)} className={cn(buttonVariants(), "w-full justify-center bg-gradient-to-r from-blue-600 to-blue-700 text-white")}>Đăng ký</Link>
                      </>
                    )}
                    {isCustomer && (
                      <>
                        <Link href="/order/create" onClick={() => setMobileOpen(false)} className={cn(buttonVariants(), "w-full justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold")}><Plus className="h-4 w-4" /> Tạo đơn mới</Link>
                        <Button variant="outline" className="w-full gap-1.5" onClick={handleLogout}><LogOut className="h-4 w-4" /> Đăng xuất</Button>
                      </>
                    )}
                    {isAdmin && (
                      <>
                        <Link href="/admin" onClick={() => setMobileOpen(false)} className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center gap-1.5")}><Shield className="h-4 w-4" /> Trang quản trị</Link>
                        <Button variant="outline" className="w-full gap-1.5" onClick={handleLogout}><LogOut className="h-4 w-4" /> Đăng xuất</Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
