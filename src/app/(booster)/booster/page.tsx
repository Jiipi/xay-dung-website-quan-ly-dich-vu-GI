"use client";

import { useEffect, useState } from "react";
import {
  Swords,
  Clock,
  CheckCircle2,
  DollarSign,
  Upload,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/constants";
import { toast } from "sonner";

interface BoosterOrder {
  id: string;
  orderNumber: string;
  userName: string;
  userEmail: string;
  serviceName: string;
  priceOptionName: string;
  amount: number;
  boosterCommission?: number | null;
  status: string;
  uid: string;
  server: string;
  note?: string | null;
  resultImages: string[];
  createdAt: string;
  updatedAt: string;
}

export default function BoosterDashboardPage() {
  const [orders, setOrders] = useState<BoosterOrder[]>([]);
  const [stats, setStats] = useState({
    totalAssigned: 0,
    inProgress: 0,
    completed: 0,
    totalEarned: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal cập nhật đơn
  const [selectedOrder, setSelectedOrder] = useState<BoosterOrder | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string>("");
  const [updateNote, setUpdateNote] = useState<string>("");
  const [imageUrlInput, setImageUrlInput] = useState<string>("");
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/booster/orders");
      const data = await res.json();

      if (data.success) {
        setOrders(data.orders);
        setStats(data.stats);
      } else {
        toast.error(data.error || "Không thể tải danh sách đơn hàng");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, []);

  const handleOpenUpdateModal = (order: BoosterOrder) => {
    setSelectedOrder(order);
    setUpdateStatus(order.status);
    setUpdateNote("");
    setImageUrlInput("");
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;

    try {
      setUpdating(true);
      const newImages = [...selectedOrder.resultImages];
      if (imageUrlInput.trim()) {
        newImages.push(imageUrlInput.trim());
      }

      const res = await fetch(`/api/booster/orders/${selectedOrder.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: updateStatus,
          note: updateNote,
          resultImages: newImages,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Cập nhật thành công!");
        setSelectedOrder(null);
        fetchOrders();
      } else {
        toast.error(data.error || "Cập nhật thất bại");
      }
    } catch {
      toast.error("Lỗi khi kết nối máy chủ");
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "all") return true;
    return o.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Bảng Điều Khiển Cày Thuê Viên
        </h1>
        <p className="text-muted-foreground text-sm">
          Quản lý các đơn hàng được gán, cập nhật tiến độ và theo dõi hoa hồng.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/60 backdrop-blur-sm border-border/50">
          <CardContent className="p-4 sm:p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Đơn được gán</p>
              <h3 className="text-2xl font-black mt-1">{stats.totalAssigned}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Swords className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-sm border-border/50">
          <CardContent className="p-4 sm:p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Đang thực hiện</p>
              <h3 className="text-2xl font-black text-amber-500 mt-1">{stats.inProgress}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-sm border-border/50">
          <CardContent className="p-4 sm:p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Đã hoàn thành</p>
              <h3 className="text-2xl font-black text-emerald-500 mt-1">{stats.completed}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-sm border-border/50">
          <CardContent className="p-4 sm:p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Tổng hoa hồng</p>
              <h3 className="text-lg sm:text-xl font-extrabold text-amber-500 mt-1">
                {formatCurrency(stats.totalEarned)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Filter & List */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-bold">Danh Sách Đơn Hàng Gán</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              className="text-xs"
            >
              Tất cả
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "in_progress" ? "default" : "outline"}
              onClick={() => setStatusFilter("in_progress")}
              className="text-xs"
            >
              Đang cày
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "completed" ? "default" : "outline"}
              onClick={() => setStatusFilter("completed")}
              className="text-xs"
            >
              Hoàn thành
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Đang tải danh sách đơn hàng...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm border border-dashed rounded-xl">
              Chưa có đơn hàng nào trong mục này.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const commission = order.boosterCommission ?? order.amount * 0.3;

                return (
                  <div
                    key={order.id}
                    className="border border-border/50 rounded-xl p-4 sm:p-5 bg-card/40 hover:bg-card/80 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-amber-500 mr-2">
                          #{order.orderNumber}
                        </span>
                        <span className="font-bold text-foreground text-base">
                          {order.serviceName} ({order.priceOptionName})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            order.status === "completed"
                              ? "default"
                              : order.status === "in_progress"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs capitalize"
                        >
                          {order.status === "in_progress"
                            ? "Đang cày"
                            : order.status === "completed"
                            ? "Đã hoàn thành"
                            : order.status}
                        </Badge>
                        <Badge variant="outline" className="border-amber-500/30 text-amber-500 text-xs">
                          Hoa hồng: {formatCurrency(commission)}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
                      <div>
                        <span className="block font-medium text-foreground/70">Khách hàng:</span>
                        {order.userName}
                      </div>
                      <div>
                        <span className="block font-medium text-foreground/70">UID Game:</span>
                        <code className="font-mono text-amber-500">{order.uid}</code> ({order.server})
                      </div>
                      <div>
                        <span className="block font-medium text-foreground/70">Giá trị đơn:</span>
                        {formatCurrency(order.amount)}
                      </div>
                      <div>
                        <span className="block font-medium text-foreground/70">Ảnh nghiệm thu:</span>
                        {order.resultImages.length} ảnh
                      </div>
                    </div>

                    {order.note && (
                      <div className="text-xs bg-muted/40 p-2.5 rounded-lg border border-border/40 text-muted-foreground">
                        <span className="font-semibold text-foreground">Ghi chú khách:</span> {order.note}
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleOpenUpdateModal(order)}
                        className="gap-1.5 font-semibold text-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Cập nhật tiến độ & Nộp ảnh
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Cập Nhật Đơn hàng cho Booster */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-500" />
                Cập nhật đơn hàng #{selectedOrder.orderNumber}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div>
                <Label className="text-xs font-semibold">Trạng thái cày thuê</Label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-background text-sm font-medium focus:ring-1 focus:ring-amber-500"
                >
                  <option value="in_progress">Đang cày (In Progress)</option>
                  <option value="completed_waiting_confirm">
                    Đã cày xong — Chờ khách xác nhận
                  </option>
                  <option value="completed">Đã Hoàn Thành (Completed)</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Thêm URL Ảnh Bằng Chứng Nghiệm Thu</Label>
                <Input
                  placeholder="https://example.com/screenshot.jpg"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="mt-1.5 text-sm"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Dán liên kết ảnh minh chứng hoàn thành (VD: Ảnh La Hoàn 36 sao, túi đồ).
                </p>
              </div>

              {selectedOrder.resultImages.length > 0 && (
                <div>
                  <Label className="text-xs font-semibold block mb-1.5">Ảnh đã tải lên ({selectedOrder.resultImages.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.resultImages.map((img, i) => (
                      <a
                        key={i}
                        href={img}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-500 underline truncate max-w-[200px]"
                      >
                        Ảnh #{i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs font-semibold">Ghi chú tiến độ / Báo cáo</Label>
                <Textarea
                  placeholder="Nhập chi tiết tiến độ hoặc lời nhắn cho khách/admin..."
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  className="mt-1.5 text-sm"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedOrder(null)} disabled={updating}>
                Hủy
              </Button>
              <Button onClick={handleUpdateOrder} disabled={updating} className="font-bold">
                {updating ? "Đang lưu..." : "Xác nhận cập nhật"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
