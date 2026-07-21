"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { ShieldAlert, Coins, Loader2 } from "lucide-react";
import { adjustWalletBalance } from "@/modules/wallet/admin-actions";

interface UserOption {
  id: string;
  name: string;
  email: string;
  balance: number;
}

export default function AdminWalletAdjustPage() {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [action, setAction] = useState<"plus" | "minus">("plus");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users.filter((u: { role: string }) => u.role !== "ADMIN"));
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách user:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    // Fetch khi mount (pattern client hợp lệ; fix triệt để = Server Component, P2-8).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, []);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error("Vui lòng chọn khách hàng cần chỉnh sửa");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("Số tiền điều chỉnh phải lớn hơn 0đ");
      return;
    }
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do thực hiện");
      return;
    }

    setLoading(true);

    try {
      const finalAmount = action === "plus" ? Number(amount) : -Number(amount);
      const res = await adjustWalletBalance(selectedUserId, finalAmount, reason);

      if (res.success) {
        const user = users.find((u) => u.id === selectedUserId);
        toast.success(
          `Đã điều chỉnh ${action === "plus" ? "+" : "-"}${Number(amount).toLocaleString()}đ cho khách ${
            user?.name
          } thành công!`
        );
        setAmount("");
        setReason("");
        setSelectedUserId("");
        fetchUsers(); // Tải lại số dư mới nhất
      } else {
        toast.error(res.error || "Điều chỉnh số dư thất bại");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  if (usersLoading) {
    return (
      <div className="pt-32 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="text-slate-400 text-sm">Đang tải danh sách thành viên...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto text-slate-100">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Điều chỉnh số dư ví</h1>
        <p className="text-slate-400 text-sm">
          Thay đổi tăng hoặc giảm số dư ví nội bộ của khách hàng trong trường hợp cần đối soát thủ
          công.
        </p>
      </div>

      <Card className="border-slate-800 bg-slate-950">
        <CardHeader>
          <CardTitle className="text-lg text-slate-200">Form điều chỉnh số dư</CardTitle>
          <CardDescription className="text-slate-500 text-xs">
            Bắt buộc phải ghi rõ lý do để ghi nhật ký audit log.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdjust} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Chọn khách hàng</Label>
              <Select value={selectedUserId} onValueChange={(val) => { if (val) setSelectedUserId(val); }}>
                <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-100">
                  <SelectValue placeholder="Bấm vào để chọn khách hàng" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.email}) - Số dư: {u.balance.toLocaleString()}đ
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Hình thức điều chỉnh</Label>
                <Select value={action} onValueChange={(val) => setAction(val as "plus" | "minus")}>
                  <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    <SelectItem value="plus">Cộng thêm tiền (+)</SelectItem>
                    <SelectItem value="minus">Trừ bớt tiền (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Số tiền (đ)</Label>
                <Input
                  type="number"
                  placeholder="Ví dụ: 100,000"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  required
                  className="bg-slate-900 border-slate-800 text-slate-100 focus:border-amber-500/50 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Lý do điều chỉnh</Label>
              <Input
                placeholder="Ghi rõ lý do: Hoàn tiền đơn lỗi, khuyến mãi, bù tiền..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="bg-slate-900 border-slate-800 text-slate-100 focus:border-amber-500/50"
              />
            </div>

            <Alert className="bg-rose-500/10 border-rose-500/20 text-rose-400">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Cảnh báo bảo mật:</strong> Mọi hành động tăng giảm tiền thủ công bằng chức
                năng này đều được lưu vết vĩnh viễn trong Audit Logs kèm IP, Admin xử lý và thời
                gian để phục vụ đối soát.
              </AlertDescription>
            </Alert>

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Coins className="h-4 w-4 text-amber-400" />
              )}
              Xác nhận thực hiện điều chỉnh
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
