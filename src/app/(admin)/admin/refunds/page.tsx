"use client";

import { useEffect, useState } from "react";
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/constants";
import { toast } from "sonner";

interface RefundItem {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  description?: string | null;
  evidence: string[];
  status: string;
  amount: number;
  resolution?: string | null;
  createdAt: string;
  user?: { name: string; email: string };
  order?: { orderNumber: string; service?: { name: string } };
}

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRefund, setSelectedRefund] = useState<RefundItem | null>(null);
  const [resolution, setResolution] = useState("");
  const [actionType, setActionType] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [processing, setProcessing] = useState(false);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/refunds");
      const data = await res.json();
      if (data.success) {
        setRefunds(data.refunds);
      } else {
        toast.error(data.error || "Không thể tải danh sách khiếu nại");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRefunds();
  }, []);

  const handleOpenActionModal = (refund: RefundItem, type: "APPROVED" | "REJECTED") => {
    setSelectedRefund(refund);
    setActionType(type);
    setResolution("");
  };

  const handleModerateRefund = async () => {
    if (!selectedRefund) return;
    try {
      setProcessing(true);
      const res = await fetch(`/api/refunds/${selectedRefund.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: actionType,
          resolution: resolution.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          actionType === "APPROVED"
            ? `Đã duyệt hoàn ${formatCurrency(selectedRefund.amount)} vào ví khách hàng!`
            : "Đã từ chối yêu cầu hoàn tiền."
        );
        setSelectedRefund(null);
        fetchRefunds();
      } else {
        toast.error(data.error || "Xử lý khiếu nại thất bại");
      }
    } catch {
      toast.error("Lỗi khi xử lý khiếu nại");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Khiếu Nại & Hoàn Tiền</h1>
        <p className="text-slate-400 text-sm">
          Xem xét các yêu cầu hoàn tiền từ khách hàng và phê duyệt tự động hoàn vào ví sổ cái.
        </p>
      </div>

      <Card className="border-slate-800 bg-slate-950">
        <CardHeader>
          <CardTitle className="text-base text-slate-200">Danh sách Khiếu nại chờ xử lý</CardTitle>
          <CardDescription className="text-slate-500 text-xs">
            Tổng cộng {refunds.length} yêu cầu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Đang tải dữ liệu khiếu nại...</div>
          ) : refunds.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm border border-slate-800 border-dashed rounded-xl">
              Hiện không có yêu cầu hoàn tiền nào cần xử lý.
            </div>
          ) : (
            <div className="space-y-4">
              {refunds.map((ref) => (
                <div
                  key={ref.id}
                  className="p-5 border border-slate-800 rounded-xl bg-slate-900/50 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold text-slate-200">
                        {ref.order?.orderNumber || `Mã đơn: ${ref.orderId}`}
                      </span>
                      <span className="text-slate-500 text-xs">• Lý do: {ref.reason}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-amber-500/30 text-amber-500 text-xs">
                        Số tiền hoàn: {formatCurrency(ref.amount)}
                      </Badge>
                      <Badge
                        variant={ref.status === "PENDING" ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {ref.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-400">
                    <div>
                      <span className="text-slate-500 block">Khách hàng:</span>
                      {ref.user?.name || ref.userId} ({ref.user?.email || "N/A"})
                    </div>
                    <div>
                      <span className="text-slate-500 block">Ngày tạo yêu cầu:</span>
                      {formatDate(ref.createdAt)}
                    </div>
                  </div>

                  {ref.description && (
                    <div className="text-xs bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300">
                      <span className="font-semibold text-amber-500">Mô tả khiếu nại:</span>{" "}
                      {ref.description}
                    </div>
                  )}

                  {ref.status === "PENDING" && (
                    <div className="pt-2 flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenActionModal(ref, "REJECTED")}
                        className="border-red-900/50 text-red-400 hover:bg-red-950/50 text-xs"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Từ chối khiếu nại
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleOpenActionModal(ref, "APPROVED")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Duyệt hoàn {formatCurrency(ref.amount)}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal xử lý khiếu nại */}
      {selectedRefund && (
        <Dialog open={!!selectedRefund} onOpenChange={() => setSelectedRefund(null)}>
          <DialogContent className="bg-slate-950 border-slate-800 text-slate-100 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-slate-100 flex items-center gap-2">
                {actionType === "APPROVED" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                {actionType === "APPROVED" ? "Phê duyệt Hoàn tiền" : "Từ chối Khiếu nại"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <p className="text-slate-300">
                {actionType === "APPROVED"
                  ? `Xác nhận hoàn ${formatCurrency(selectedRefund.amount)} trực tiếp vào ví sổ cái của khách hàng.`
                  : "Xác nhận từ chối yêu cầu hoàn tiền này."}
              </p>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Ghi chú phản hồi / Lý do xử lý (hiển thị cho khách)
                </label>
                <Textarea
                  placeholder="Nhập ghi chú phản hồi cho khách hàng..."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-slate-100 text-xs"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedRefund(null)}
                disabled={processing}
                className="border-slate-800 text-slate-300 text-xs"
              >
                Hủy
              </Button>
              <Button
                onClick={handleModerateRefund}
                disabled={processing}
                className={
                  actionType === "APPROVED"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    : "bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                }
              >
                {processing ? "Đang xử lý..." : "Xác nhận ngay"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
