"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/constants";
import { ArrowLeft, Ban, CheckCircle, Loader2, ShieldCheck, Wallet, ShoppingBag, History } from "lucide-react";

interface UserOrderDetail {
  id: string;
  orderNumber: string;
  amount: number;
  status: string;
  createdAt: string;
  service: { name: string };
}

interface UserTxDetail {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  status: string;
  createdAt: string;
}

interface UserDetailData {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  balance: number;
  createdAt: string;
  orders: UserOrderDetail[];
  transactions: UserTxDetail[];
}

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;

  const [user, setUser] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      } else {
        toast.error(data.error || "Không thể tải thông tin người dùng");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const handleRoleChange = async (newRole: string | null) => {
    if (!user || !newRole) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Đã đổi vai trò của ${user.name} thành ${newRole}`);
        setUser({ ...user, role: newRole });
      } else {
        toast.error(data.error || "Không thể đổi vai trò");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleActive = async () => {
    if (!user) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Đã ${!user.isActive ? "kích hoạt" : "khóa"} tài khoản ${user.name}`);
        setUser({ ...user, isActive: !user.isActive });
      } else {
        toast.error(data.error || "Không thể cập nhật trạng thái");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20 text-slate-400">
        Người dùng không tồn tại.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-slate-100">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chi tiết tài khoản thành viên</h1>
          <p className="text-slate-400 text-xs font-mono">ID: {user.id}</p>
        </div>
      </div>

      {/* Profile Overview Card */}
      <Card className="border-slate-800 bg-slate-950">
        <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-amber-500/20">
              <AvatarFallback className="bg-amber-500/10 text-amber-500 text-xl font-bold">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">{user.name}</h2>
                <Badge className={user.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}>
                  {user.isActive ? "Đang hoạt động" : "Đang bị khóa"}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 font-mono">{user.email}</p>
              <p className="text-[10px] text-slate-500">Tham gia từ: {formatDate(user.createdAt)}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-center min-w-[140px]">
              <span className="text-[10px] text-slate-400 block">Số dư ví hiện tại</span>
              <span className="text-lg font-bold text-amber-500">{formatCurrency(user.balance)}</span>
            </div>

            <div className="space-y-1 min-w-[140px]">
              <label className="text-[10px] text-slate-400 block">Vai trò hệ thống</label>
              <Select value={user.role} onValueChange={handleRoleChange} disabled={updating || user.role === "ADMIN"}>
                <SelectTrigger className="bg-slate-900 border-slate-800 text-xs text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                  <SelectItem value="CUSTOMER">CUSTOMER (Khách)</SelectItem>
                  <SelectItem value="BOOSTER">BOOSTER (Thợ cày)</SelectItem>
                  <SelectItem value="ADMIN">ADMIN (Quản trị)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {user.role !== "ADMIN" && (
              <Button
                variant={user.isActive ? "destructive" : "outline"}
                size="sm"
                onClick={handleToggleActive}
                disabled={updating}
                className="gap-1.5 font-bold"
              >
                {user.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                {user.isActive ? "Khóa tài khoản" : "Kích hoạt"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders and Wallet Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Orders */}
        <Card className="border-slate-800 bg-slate-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-amber-500" /> Đơn hàng gần đây
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">10 đơn hàng mới nhất của khách</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {user.orders.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">Chưa có đơn hàng nào.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400 text-xs">Mã đơn</TableHead>
                    <TableHead className="text-slate-400 text-xs">Dịch vụ</TableHead>
                    <TableHead className="text-slate-400 text-xs">Giá tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.orders.map((o) => (
                    <TableRow key={o.id} className="hover:bg-slate-900 border-slate-800">
                      <TableCell className="font-mono text-xs font-bold text-slate-300">
                        <Link href={`/admin/orders/${o.id}`} className="hover:text-amber-500 underline">
                          {o.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-slate-300">{o.service.name}</TableCell>
                      <TableCell className="text-xs font-bold text-amber-500">{formatCurrency(o.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Wallet Transactions */}
        <Card className="border-slate-800 bg-slate-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-500" /> Lịch sử biến động số dư
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">10 giao dịch nạp / trừ tiền gần đây</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {user.transactions.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">Chưa có giao dịch ví nào.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400 text-xs">Nội dung</TableHead>
                    <TableHead className="text-slate-400 text-xs">Số tiền</TableHead>
                    <TableHead className="text-slate-400 text-xs">Số dư sau</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.transactions.map((t) => (
                    <TableRow key={t.id} className="hover:bg-slate-900 border-slate-800">
                      <TableCell className="text-xs text-slate-300 truncate max-w-[160px]">{t.description}</TableCell>
                      <TableCell className={`text-xs font-bold ${t.amount >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {t.amount >= 0 ? `+${formatCurrency(t.amount)}` : formatCurrency(t.amount)}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-400">{formatCurrency(t.balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
