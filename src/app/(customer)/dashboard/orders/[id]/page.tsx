"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Send,
  MessageCircle,
  FileText,
  ShieldCheck,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { formatCurrency, formatDate, type OrderStatus } from "@/lib/constants";
import type { OrderMessage } from "@/lib/types";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RotateCcw } from "lucide-react";

interface OrderDetail {
  id: string;
  orderNumber: string;
  serviceName: string;
  priceOptionName: string;
  amount: number;
  status: OrderStatus;
  uid: string;
  server: string;
  note: string;
  resultImages?: string[];
  createdAt: string;
  statusLogs: {
    id: string;
    status: OrderStatus;
    note: string;
    createdAt: string;
    createdBy: string;
  }[];
}

export default function CustomerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Refund Modal State
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("Dịch vụ chậm trễ");
  const [refundDescription, setRefundDescription] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const handleCreateRefundRequest = async () => {
    if (!order) return;
    try {
      setSubmittingRefund(true);
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          reason: refundReason,
          description: refundDescription.trim() || undefined,
          amount: order.amount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Đã gửi yêu cầu khiếu nại hoàn tiền! Admin sẽ xử lý sớm nhất.");
        setRefundModalOpen(false);
      } else {
        toast.error(data.error || "Gửi khiếu nại thất bại");
      }
    } catch {
      toast.error("Lỗi khi kết nối máy chủ");
    } finally {
      setSubmittingRefund(false);
    }
  };

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const [orderRes, msgRes] = await Promise.all([
          fetch(`/api/orders/${orderId}`),
          fetch(`/api/orders/${orderId}/messages`),
        ]);
        if (!orderRes.ok) {
          router.push("/dashboard/orders");
          return;
        }
        const data = await orderRes.json();
        if (data.success) {
          setOrder(data.order);
        }
        const msgData = await msgRes.json();
        if (msgData.success) {
          setMessages(msgData.messages);
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin chi tiết đơn:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetail();
  }, [orderId, router]);

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
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err);
      toast.error("Lỗi kết nối khi gửi tin nhắn");
      setNewMessage(content);
    }
  };

  if (loading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">Đơn hàng không tồn tại.</p>
        <Link href="/dashboard/orders">
          <Button>Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top action */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">Chi tiết đơn hàng</h1>
              <span className="font-mono text-sm font-bold text-muted-foreground">
                {order.orderNumber}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Khởi tạo lúc: {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setRefundModalOpen(true)}
          className="border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Gửi khiếu nại / Hoàn tiền
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Order Information & History */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">{order.serviceName}</CardTitle>
                <CardDescription className="mt-1">
                  Gói cước: {order.priceOptionName} • Đã thanh toán:{" "}
                  <span className="text-amber-500 font-bold">
                    {formatCurrency(order.amount)}
                  </span>
                </CardDescription>
              </div>
              <StatusBadge status={order.status} />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Game Acc Credentials */}
              <div className="p-4 rounded-xl border border-dashed bg-muted/20 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-amber-500" />
                  Thông tin đăng nhập game
                </h3>
                <div className="grid sm:grid-cols-3 gap-4 text-sm pt-1">
                  <div>
                    <span className="text-muted-foreground text-xs block">UID Game</span>
                    <span className="font-bold">{order.uid}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Server</span>
                    <span className="font-semibold">{order.server}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Mật khẩu game</span>
                    <span className="text-slate-500 font-mono italic">
                      [Đã mã hóa bảo mật]
                    </span>
                  </div>
                </div>
                {order.note && (
                  <div className="border-t pt-2 mt-2">
                    <span className="text-muted-foreground text-xs block">Ghi chú từ bạn</span>
                    <p className="text-xs text-slate-300 italic">{order.note}</p>
                  </div>
                )}
              </div>

              {/* Proof of Work / Result Images Gallery */}
              {order.resultImages && order.resultImages.length > 0 && (
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Hình ảnh minh chứng kết quả hoàn thành ({order.resultImages.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                    {order.resultImages.map((imgUrl, idx) => (
                      <a
                        key={idx}
                        href={imgUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative aspect-video rounded-lg overflow-hidden border border-border/50 bg-black/40 hover:border-emerald-500/50 transition-all shadow-sm hover:shadow-md"
                      >
                        <img
                          src={imgUrl}
                          alt={`Proof ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white">
                          Xem ảnh gốc ↗
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress Timeline */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Tiến độ thực hiện
                </h3>

                <div className="relative pl-6 border-l border-border space-y-6 py-2">
                  {order.statusLogs.map((log, index) => (
                    <div key={log.id} className="relative">
                      {/* Timeline Node Icon */}
                      <span className="absolute -left-[31px] top-0 bg-background p-0.5 rounded-full z-10">
                        <CheckCircle className={`h-4 w-4 ${index === 0 ? 'text-primary' : 'text-slate-500'}`} />
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">
                            <StatusBadge status={log.status} />
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(log.createdAt)} • bởi {log.createdBy}
                          </span>
                        </div>
                        {log.note && (
                          <p className="text-xs text-muted-foreground pl-1">
                            {log.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Interactive Admin Chat */}
        <div className="space-y-6">
          <Card className="border-border/50 h-[500px] flex flex-col overflow-hidden">
            <CardHeader className="pb-3 border-b shrink-0 bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" /> Trao đổi với Admin
              </CardTitle>
              <CardDescription className="text-xs">
                Nhắn tin nếu cần bổ sung thông tin hoặc thay đổi mật khẩu
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col min-h-0 bg-muted/10">
              {/* Chat View */}
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="h-[300px] flex flex-col items-center justify-center text-center text-muted-foreground p-6 space-y-2">
                    <MessageCircle className="h-10 w-10 stroke-1 text-slate-400" />
                    <p className="text-xs">Chưa có tin nhắn nào.</p>
                  </div>
                ) : (
                  <div className="space-y-4 pb-4">
                    {messages.map((msg) => {
                      const isAdmin = msg.senderRole === "ADMIN";
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-[80%] ${
                            isAdmin ? "" : "ml-auto items-end"
                          }`}
                        >
                          <span className="text-[10px] text-muted-foreground mb-0.5 px-1">
                            {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div
                            className={`p-3 rounded-2xl text-xs leading-relaxed ${
                              isAdmin
                                ? "bg-slate-800 text-slate-100 rounded-tl-none border"
                                : "bg-primary text-primary-foreground rounded-tr-none"
                            }`}
                          >
                            {msg.message}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t shrink-0 flex gap-2 bg-background">
                <Input
                  placeholder="Nhập tin nhắn hỗ trợ..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 text-xs"
                />
                <Button type="submit" size="icon" className="h-9 w-9">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Yêu Cầu Hoàn Tiền / Khiếu Nại */}
      <Dialog open={refundModalOpen} onOpenChange={setRefundModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <RotateCcw className="w-4 h-4 text-amber-500" />
              Yêu cầu Hoàn tiền / Khiếu nại đơn #{order.orderNumber}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <Label className="text-xs font-semibold block mb-1.5">Lý do khiếu nại</Label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs font-medium"
              >
                <option value="Dịch vụ chậm trễ">Dịch vụ chậm trễ quá cam kết</option>
                <option value="Kết quả không đúng mô tả">Kết quả không đúng yêu cầu gói</option>
                <option value="Sự cố tài khoản game">Sự cố liên quan tài khoản game</option>
                <option value="Khác">Lý do khác</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold block mb-1.5">Mô tả chi tiết khiếu nại</Label>
              <Textarea
                placeholder="Nhập chi tiết vấn đề bạn gặp phải để Admin làm việc với Booster..."
                value={refundDescription}
                onChange={(e) => setRefundDescription(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400">
              Số tiền yêu cầu hoàn: <strong>{formatCurrency(order.amount)}</strong> (Hoàn trực tiếp vào Ví sổ cái sau khi Admin duyệt).
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundModalOpen(false)} disabled={submittingRefund}>
              Hủy
            </Button>
            <Button onClick={handleCreateRefundRequest} disabled={submittingRefund} className="font-bold">
              {submittingRefund ? "Đang gửi..." : "Gửi yêu cầu ngay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
