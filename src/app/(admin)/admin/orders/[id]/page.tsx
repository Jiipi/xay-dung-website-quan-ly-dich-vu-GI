"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Loader2,
  User,
  Package,
  Clock,
  Key,
  AlertTriangle,
  Eye,
} from "lucide-react";

interface StatusLog {
  id: string;
  previousStatus?: string | null;
  newStatus: string;
  note?: string | null;
  createdAt: string;
}

interface OrderDetail {
  id: string;
  status: string;
  finalAmount: number;
  totalAmount: number;
  discountAmount: number;
  accountLoginType?: string | null;
  ingameName?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  user: { name: string; email: string };
  service: { name: string };
  priceOption?: { name: string } | null;
  statusLogs: StatusLog[];
  credentials: { id: string; viewCount: number; expiresAt: string; isUsed: boolean }[];
}

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [revealedPass, setRevealedPass] = useState<string | null>(null);

  const fetchOrderDetail = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (!res.ok) {
        toast.error("Không thể tải thông tin đơn hàng");
        return;
      }
      const data = await res.json();
      if (data.success || data.order) {
        setOrder(data.order || data);
      } else {
        toast.error(data.error || "Lỗi dữ liệu đơn hàng");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi mạng khi tải đơn hàng");
    } finally {
       
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrderDetail();
  }, [orderId]);

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success(`Đã cập nhật trạng thái sang ${newStatus}`);
        fetchOrderDetail();
      } else {
        toast.error(data.error || "Không thể cập nhật trạng thái");
      }
    } catch {
      toast.error("Lỗi kết nối khi cập nhật đơn");
    } finally {
      setUpdating(false);
    }
  };

  const handleRevealPassword = async () => {
    try {
      const res = await fetch(`/api/admin/orders/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.password) {
        setRevealedPass(data.password);
        toast.success("Đã lấy mật khẩu tài khoản");
      } else {
        toast.error(data.error || "Không thể lấy thông tin đăng nhập");
      }
    } catch {
      toast.error("Lỗi hệ thống khi giải mã mật khẩu");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-sm">Đang tải thông tin chi tiết đơn hàng #{orderId.slice(0, 8)}...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
        <h2 className="text-xl font-bold text-white">Đơn hàng không tồn tại</h2>
        <Link href="/admin/orders" className={buttonVariants({ variant: "outline" })}>
          Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }

  const statusColorMap: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    PROCESSING: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    CANCELLED: "bg-red-500/10 text-red-400 border-red-500/30",
    REFUNDED: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto text-slate-100">
      {/* Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-slate-400 hover:text-white")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Đơn hàng
          </Link>
          <span className="text-slate-600">/</span>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono">
            #{order.id}
          </h1>
          <Badge className={cn("border px-2.5 py-0.5 text-xs font-semibold", statusColorMap[order.status] || "bg-slate-800 text-slate-300")}>
            {order.status}
          </Badge>
        </div>

        {/* Action button status controls */}
        <div className="flex flex-wrap items-center gap-2">
          {order.status === "PENDING" && (
            <Button
              size="sm"
              onClick={() => handleUpdateStatus("PROCESSING")}
              disabled={updating}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {updating && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Bắt đầu xử lý
            </Button>
          )}

          {order.status === "PROCESSING" && (
            <Button
              size="sm"
              onClick={() => handleUpdateStatus("COMPLETED")}
              disabled={updating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {updating && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Hoàn thành đơn
            </Button>
          )}

          {order.status !== "CANCELLED" && order.status !== "REFUNDED" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleUpdateStatus("CANCELLED")}
              disabled={updating}
            >
              Hủy đơn
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service & Pricing Card */}
          <Card className="border-slate-800 bg-slate-950/80 shadow-lg">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-500" />
                Thông tin dịch vụ & Thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Tên dịch vụ</p>
                  <p className="font-semibold text-white mt-0.5">{order.service.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Gói tùy chọn</p>
                  <p className="font-semibold text-white mt-0.5">{order.priceOption?.name || "Gói tiêu chuẩn"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Tổng tiền</p>
                  <p className="font-semibold text-amber-400 text-base mt-0.5">{formatCurrency(order.finalAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Thời gian khởi tạo</p>
                  <p className="font-semibold text-slate-300 text-xs mt-1">{formatDate(order.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credentials Card */}
          <Card className="border-slate-800 bg-slate-950/80 shadow-lg">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-400" />
                Tài khoản Game Khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Tên nhân vật / UID</p>
                  <p className="font-semibold text-white mt-0.5">{order.ingameName || "Chưa cung cấp"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Phương thức đăng nhập</p>
                  <p className="font-semibold text-white mt-0.5">{order.accountLoginType || "HoYoverse"}</p>
                </div>
              </div>

              {order.notes && (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <p className="text-slate-400 font-semibold mb-1">Ghi chú từ khách hàng:</p>
                  <p className="text-slate-200">{order.notes}</p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Mật khẩu game (Mã hóa AES-256)</p>
                  {revealedPass ? (
                    <p className="text-sm font-mono text-emerald-400 font-bold mt-1">{revealedPass}</p>
                  ) : (
                    <p className="text-xs text-slate-500 italic mt-0.5">****************</p>
                  )}
                </div>
                {!revealedPass && (
                  <Button size="sm" variant="outline" onClick={handleRevealPassword} className="gap-1.5 border-slate-700">
                    <Eye className="h-4 w-4" /> Xem mật khẩu
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="border-slate-800 bg-slate-950/80 shadow-lg">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <User className="h-5 w-5 text-purple-400" />
                Khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-sm">
              <p className="font-semibold text-white">{order.user.name}</p>
              <p className="text-xs text-slate-400">{order.user.email}</p>
            </CardContent>
          </Card>

          {/* Status logs timeline */}
          <Card className="border-slate-800 bg-slate-950/80 shadow-lg">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-400" />
                Lịch sử trạng thái
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4 text-xs">
                {order.statusLogs.map((log) => (
                  <div key={log.id} className="border-l-2 border-slate-700 pl-3 py-1 space-y-0.5">
                    <p className="font-semibold text-slate-200">
                      Chuyển sang <span className="text-amber-400">{log.newStatus}</span>
                    </p>
                    <p className="text-slate-500">{formatDate(log.createdAt)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
