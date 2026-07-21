"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Flame, Loader2, CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Mã khôi phục không hợp lệ");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới tối thiểu 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCompleted(true);
        toast.success(data.message || "Đổi mật khẩu thành công!");
      } else {
        toast.error(data.error || "Đặt lại mật khẩu thất bại");
      }
    } catch {
      toast.error("Lỗi kết nối tới máy chủ");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Card className="border-border/50 shadow-lg p-6 text-center">
        <p className="text-muted-foreground text-sm mb-4">
          Liên kết khôi phục mật khẩu không hợp lệ hoặc thiếu token.
        </p>
        <Link href="/login">
          <Button variant="outline">Quay lại Đăng nhập</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Lock className="w-5 h-5 text-amber-500" />
          Đặt lại mật khẩu mới
        </CardTitle>
        <CardDescription>
          Nhập mật khẩu mới cho tài khoản Genshin77 của bạn
        </CardDescription>
      </CardHeader>
      <CardContent>
        {completed ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Đã đổi mật khẩu thành công!</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Mật khẩu mới đã được cập nhật. Bạn có thể sử dụng mật khẩu mới để đăng nhập.
            </p>
            <Link href="/login">
              <Button className="font-bold w-full">Đăng Nhập Ngay</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-pass">Mật khẩu mới</Label>
              <Input
                id="new-pass"
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-pass">Xác nhận mật khẩu mới</Label>
              <Input
                id="confirm-pass"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full font-bold" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu Mật Khẩu Mới
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <div className="lg:hidden flex items-center gap-2 mb-8">
        <Flame className="h-7 w-7 text-amber-500" />
        <span className="text-xl font-bold">
          Genshin<span className="text-amber-500">77</span>
        </span>
      </div>
      <Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
