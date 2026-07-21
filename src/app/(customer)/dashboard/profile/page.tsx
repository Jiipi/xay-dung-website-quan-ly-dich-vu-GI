"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Shield, KeyRound, Loader2, Save } from "lucide-react";

export default function CustomerProfilePage() {
  const [profileName, setProfileName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success) {
          setProfileName(data.user.name);
          setEmail(data.user.email);
          setRole(data.user.role);
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin profile:", err);
      } finally {
        setPageLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.error("Họ tên không được để trống");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Cập nhật họ tên thành công!");
        // Refresh page to update sidebar
        window.location.reload();
      } else {
        toast.error(data.error || "Không thể cập nhật hồ sơ");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast.error("Chức năng đổi mật khẩu đang được bảo trì!");
  };

  if (pageLoading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-muted-foreground text-sm">
          Quản lý thông tin tài khoản web của bạn và thay đổi mật khẩu đăng nhập.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Avatar & Overview */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-border/50 text-center">
            <CardContent className="p-6 flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {profileName.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-lg">{profileName}</h3>
              <p className="text-xs text-muted-foreground mt-1">{email}</p>

              <div className="mt-6 flex flex-col gap-2 w-full">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  Cấp bậc tài khoản
                </span>
                <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-semibold uppercase tracking-wider">
                  <Shield className="h-3 w-3" />
                  {role} MEMBER
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Edit Profile & Password */}
        <div className="md:col-span-2 space-y-6">
          {/* Edit Profile */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Thông tin cá nhân
              </CardTitle>
              <CardDescription>
                Cập nhật thông tin hiển thị của bạn trên hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email tài khoản</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    * Không thể thay đổi email đã đăng ký tài khoản.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-name">Họ tên hiển thị</Label>
                  <Input
                    id="profile-name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" size="sm" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Lưu thay đổi
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" /> Đổi mật khẩu
              </CardTitle>
              <CardDescription>
                Nên đặt mật khẩu mạnh để bảo vệ ví tiền và đơn hàng
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Mật khẩu mới</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" size="sm" variant="outline" disabled={passwordLoading}>
                  Cập nhật mật khẩu
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
