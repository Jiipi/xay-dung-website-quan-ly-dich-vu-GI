"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Shield, KeyRound, Loader2, Save, Camera, Upload, Trash2 } from "lucide-react";

export default function CustomerProfilePage() {
  const [profileName, setProfileName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success) {
          setProfileName(data.user.name);
          setEmail(data.user.email);
          setRole(data.user.role);
          setAvatarUrl(data.user.avatarUrl || null);
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin profile:", err);
      } finally {
        setPageLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveAvatar = async (url: string | null) => {
    setAvatarUrl(url);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(url ? "Đã cập nhật ảnh đại diện mới!" : "Đã gỡ ảnh đại diện!");
      } else {
        toast.error(data.error || "Không thể cập nhật ảnh");
      }
    } catch {
      toast.error("Lỗi kết nối khi lưu ảnh đại diện");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng ảnh tối đa 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Url = reader.result as string;
      handleSaveAvatar(base64Url);
    };
    reader.readAsDataURL(file);
  };

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
        body: JSON.stringify({ name: profileName, avatarUrl }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Cập nhật thông tin thành công!");
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("Mật khẩu mới tối thiểu 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới và mật khẩu xác nhận không trùng khớp");
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Cập nhật mật khẩu mới thành công!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Không thể đổi mật khẩu");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi hệ thống khi đổi mật khẩu");
    } finally {
      setPasswordLoading(false);
    }
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
          Quản lý thông tin tài khoản web của bạn, ảnh đại diện tùy chỉnh và thay đổi mật khẩu đăng nhập.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Avatar & Overview */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-border/50 text-center">
            <CardContent className="p-6 flex flex-col items-center">
              <div
                className="relative group mb-3 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                title="Bấm để tải ảnh đại diện từ máy tính"
              >
                <Avatar className="h-24 w-24 border-2 border-primary/20 shadow-md transition-opacity group-hover:opacity-85">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={profileName} className="h-full w-full object-cover" />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                      {profileName.charAt(0) || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <h3 className="font-bold text-lg">{profileName}</h3>
              <p className="text-xs text-muted-foreground mt-1">{email}</p>

              {/* Tải ảnh tùy chỉnh hoặc Dán URL */}
              <div className="mt-5 w-full space-y-3 border-t pt-4 border-border/50 text-left">
                <Label className="text-xs font-semibold text-muted-foreground block">
                  Đổi ảnh đại diện tùy thích:
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5 text-primary" /> Tải ảnh từ máy tính
                </Button>

                <div className="space-y-1.5 pt-1">
                  <Label className="text-[11px] text-muted-foreground">Hoặc dán đường dẫn URL ảnh:</Label>
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="https://..."
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      className="text-xs h-8 bg-background border-border/80"
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 text-xs px-2.5"
                      onClick={() => {
                        if (!customUrlInput.trim()) {
                          toast.error("Vui lòng nhập đường dẫn URL ảnh");
                          return;
                        }
                        handleSaveAvatar(customUrlInput.trim());
                        setCustomUrlInput("");
                      }}
                    >
                      Áp dụng
                    </Button>
                  </div>
                </div>

                {avatarUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    onClick={() => handleSaveAvatar(null)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Gỡ ảnh hiện tại
                  </Button>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-2 w-full border-t pt-3 border-border/50">
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
                    className="bg-background border-border/80"
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
          <Card className="border-border/50 shadow-sm">
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
                    placeholder="Nhập mật khẩu hiện tại"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="bg-background border-border/80 text-foreground"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Mật khẩu mới</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Tối thiểu 6 ký tự"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="bg-background border-border/80 text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-background border-border/80 text-foreground"
                    />
                  </div>
                </div>

                <Button type="submit" size="sm" variant="default" disabled={passwordLoading} className="bg-primary hover:bg-primary/90">
                  {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
