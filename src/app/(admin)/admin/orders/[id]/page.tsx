"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Loader2,
  User,
  Package,
  Clock,
  Key,
  Eye,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  MessageCircle,
  Send,
  AlertTriangle,
} from "lucide-react";

interface StatusLog {
  id: string;
  status?: string;
  previousStatus?: string | null;
  newStatus?: string;
  note?: string | null;
  createdAt: string;
}

interface OrderMessage {
  id: string;
  message: string;
  senderRole: string;
  senderName: string;
  createdAt: string;
}

interface OrderDetail {
  id: string;
  orderNumber?: string;
  status: string;
  amount?: number;
  finalAmount?: number;
  totalAmount?: number;
  discountAmount?: number;
  accountLoginType?: string | null;
  ingameName?: string | null;
  uid?: string | null;
  server?: string | null;
  note?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  userEmail?: string;
  user?: { name: string; email: string };
  serviceName?: string;
  service?: { name: string };
  priceOptionName?: string;
  priceOption?: { name: string } | null;
  statusLogs?: StatusLog[];
  credentials?: { id: string; viewCount: number; expiresAt: string; isUsed: boolean }[];
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

  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (e) {
      console.error("Lỗi lấy tin nhắn đơn hàng:", e);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content) return;
    setNewMessage("");

    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
      } else {
        toast.error(data.error || "Không gửi được tin nhắn");
        setNewMessage(content);
      }
    } catch {
      toast.error("Lỗi kết nối khi gửi tin nhắn");
      setNewMessage(content);
    }
  };

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
    waiting_admin_accept: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    pending_payment: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    PROCESSING: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    cancelled: "bg-red-500/10 text-red-400 border-red-500/30",
    CANCELLED: "bg-red-500/10 text-red-400 border-red-500/30",
    refunded: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  };

  const statusLabelMap: Record<string, string> = {
    waiting_admin_accept: "Chờ Admin nhận đơn",
    pending_payment: "Chờ thanh toán",
    PENDING: "Chờ Admin nhận đơn",
    in_progress: "Đang thực hiện",
    PROCESSING: "Đang thực hiện",
    completed: "Đã hoàn thành",
    COMPLETED: "Đã hoàn thành",
    cancelled: "Đã hủy đơn",
    CANCELLED: "Đã hủy đơn",
    refunded: "Đã hoàn tiền",
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
            #{order.orderNumber || order.id.slice(0, 8)}
          </h1>
          <Badge className={cn("border px-2.5 py-0.5 text-xs font-semibold", statusColorMap[order.status] || "bg-slate-800 text-slate-300")}>
            {statusLabelMap[order.status] || order.status}
          </Badge>
        </div>

        {/* Action button status controls */}
        <div className="flex flex-wrap items-center gap-2">
          {(order.status === "waiting_admin_accept" || order.status === "PENDING" || order.status === "pending_payment") && (
            <Button
              size="sm"
              onClick={() => handleUpdateStatus("in_progress")}
              disabled={updating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow"
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Nhận đơn cày này
            </Button>
          )}

          {(order.status === "in_progress" || order.status === "PROCESSING") && (
            <Button
              size="sm"
              onClick={() => handleUpdateStatus("completed")}
              disabled={updating}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5 shadow"
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Hoàn thành đơn cày
            </Button>
          )}

          {order.status !== "completed" && order.status !== "COMPLETED" && order.status !== "cancelled" && order.status !== "CANCELLED" && order.status !== "refunded" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleUpdateStatus("cancelled")}
              disabled={updating}
              className="gap-1.5"
            >
              <XCircle className="h-4 w-4" /> Hủy đơn này
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
                  <p className="font-semibold text-white mt-0.5">
                    {order.serviceName || order.service?.name || "Dịch vụ cày thuê"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Gói tùy chọn</p>
                  <p className="font-semibold text-white mt-0.5">
                    {order.priceOptionName || order.priceOption?.name || "Gói tiêu chuẩn"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Tổng tiền</p>
                  <p className="font-semibold text-amber-400 text-base mt-0.5">
                    {formatCurrency(order.amount ?? order.finalAmount ?? 0)}
                  </p>
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
                  <p className="text-xs text-slate-400">UID / Server Game</p>
                  <p className="font-semibold text-white mt-0.5">
                    {order.uid ? `${order.uid}${order.server ? ` (${order.server})` : ""}` : (order.ingameName || "Chưa cung cấp")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Phương thức đăng nhập</p>
                  <p className="font-semibold text-white mt-0.5">{order.accountLoginType || "HoYoverse"}</p>
                </div>
              </div>

              {(order.note || order.notes) && (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <p className="text-slate-400 font-semibold mb-1">Ghi chú & Yêu cầu từ khách hàng:</p>
                  <p className="text-slate-200">{order.note || order.notes}</p>
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

          {/* Chat Box with Customer */}
          <Card className="border-slate-800 bg-slate-950/80 shadow-lg">
            <CardHeader className="pb-3 border-b border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-400" />
                Trao đổi với Khách hàng
              </CardTitle>
              <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">
                Trực tiếp
              </Badge>
            </CardHeader>
            <CardContent className="p-0 flex flex-col h-[380px]">
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs scrollbar-thin">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 italic">
                    Chưa có tin nhắn nào trong đơn hàng này.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdminMsg = msg.senderRole === "ADMIN" || msg.senderRole === "BOOSTER";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdminMsg ? "items-end" : "items-start"}`}
                      >
                        <span className="text-[10px] text-slate-500 mb-1">
                          {msg.senderName} ({msg.senderRole}) • {formatDate(msg.createdAt)}
                        </span>
                        <div
                          className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs break-words ${
                            isAdminMsg
                              ? "bg-amber-500 text-black font-semibold rounded-tr-none"
                              : "bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none"
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2 bg-slate-900 shrink-0">
                <Input
                  placeholder="Nhập tin nhắn phản hồi tới khách hàng..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 text-xs bg-slate-950 border-slate-700 text-white"
                />
                <Button type="submit" size="icon" className="h-9 w-9 bg-amber-500 hover:bg-amber-600 text-black font-bold">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
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
              <p className="font-semibold text-white">{order.userName || order.user?.name || "Khách hàng"}</p>
              <p className="text-xs text-slate-400">{order.userEmail || order.user?.email || "—"}</p>
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
                {(order.statusLogs || []).map((log) => (
                  <div key={log.id} className="border-l-2 border-slate-700 pl-3 py-1 space-y-0.5">
                    <p className="font-semibold text-slate-200">
                      Chuyển sang <span className="text-amber-400">{log.status || log.newStatus}</span>
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
