"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Flame, Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.user.role !== "ADMIN") {
          toast.error("Tài khoản của bạn không có quyền truy cập Admin!");
          // Logout to clear token if not admin
          fetch("/api/auth/logout", { method: "POST" });
          return;
        }

        toast.success("Đăng nhập quản trị viên thành công!");
        router.refresh();
        router.push("/admin");
      } else {
        toast.error(data.error || "Email hoặc Mật khẩu quản trị không chính xác.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4 text-slate-100 dark">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[100px]" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <Flame className="h-10 w-10 text-amber-500 animate-pulse" />
            <span className="text-2xl font-extrabold tracking-wider">
              G77<span className="text-amber-500">ADMIN</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Hệ thống đăng nhập bảo mật dành cho Quản trị viên
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Đăng nhập Admin</CardTitle>
            <CardDescription className="text-center text-xs text-slate-400">
              Nhập tài khoản quản trị được cấp quyền
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-login-email" className="text-slate-300">Email quản trị</Label>
                <Input
                  id="admin-login-email"
                  type="email"
                  placeholder="admin@Genshin77.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-950 border-slate-800 focus:border-amber-500/50 text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-login-pass" className="text-slate-300">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="admin-login-pass"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-slate-950 border-slate-800 focus:border-amber-500/50 text-slate-100 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-300"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-950" />}
                Xác thực đăng nhập
              </Button>
            </form>

            <div className="flex gap-2 items-start mt-6 p-3 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400">
              <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Hành động đăng nhập hệ thống quản trị sẽ được ghi lại nhật ký IP để phòng chống
                truy cập trái phép. Mật khẩu mặc định sandbox: <code>admin@Genshin77.vn</code> / <code>admin123</code>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
