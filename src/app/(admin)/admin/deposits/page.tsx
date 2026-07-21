"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/constants";

interface DepositIntent {
  id: string;
  userName: string;
  userEmail: string;
  amount: number;
  status: string;
  paymentCode: string;
  createdAt: string;
}

export default function AdminDepositsPage() {
  const [intents, setIntents] = useState<DepositIntent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeposits = async () => {
    try {
      const res = await fetch("/api/admin/deposits");
      const data = await res.json();
      if (data.success) {
        setIntents(data.deposits);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách nạp tiền:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch khi mount (pattern client hợp lệ; fix triệt để = Server Component, P2-8).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDeposits();
  }, []);

  const handleApproveDeposit = (id: string, code: string) => {
    // Giả lập duyệt tay thành công
    setIntents(
      intents.map((pi) => (pi.id === id ? { ...pi, status: "completed" } : pi))
    );
    toast.success(`Duyệt thủ công giao dịch nạp tiền ${code} thành công!`);
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Đối soát & Nạp tiền tự động</h1>
        <p className="text-slate-400 text-sm">
          Xem thông tin Webhook payOS VietQR và duyệt giao dịch thủ công nếu lỗi hệ thống.
        </p>
      </div>

      {/* Intents Table */}
      <Card className="border-slate-800 bg-slate-950">
        <CardHeader>
          <CardTitle className="text-lg text-slate-200">Yêu cầu thanh toán (VietQR)</CardTitle>
          <CardDescription className="text-slate-500 text-xs">
            Danh sách mã nạp QR được tạo trên hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : intents.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Chưa phát sinh yêu cầu nạp tiền nào.
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="pl-6 w-[150px] text-slate-400">Mã thanh toán</TableHead>
                    <TableHead className="text-slate-400">Khách hàng</TableHead>
                    <TableHead className="text-slate-400">Số tiền nạp</TableHead>
                    <TableHead className="text-slate-400">Trạng thái</TableHead>
                    <TableHead className="text-slate-400">Ngày tạo</TableHead>
                    <TableHead className="pr-6 w-[120px] text-right text-slate-400">Duyệt tay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {intents.map((intent) => (
                    <TableRow key={intent.id} className="hover:bg-slate-900 border-slate-800">
                      <TableCell className="pl-6 font-mono font-bold text-xs text-slate-300">
                        {intent.paymentCode}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-semibold text-slate-200">{intent.userName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{intent.userEmail}</div>
                      </TableCell>
                      <TableCell className="font-bold text-xs text-emerald-500">
                        {formatCurrency(intent.amount)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          intent.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : intent.status === "pending"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-slate-800 text-slate-500"
                        }`}>
                          {intent.status === "completed"
                            ? "Thành công"
                            : intent.status === "pending"
                            ? "Đang chờ"
                            : intent.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {formatDate(intent.createdAt)}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        {intent.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleApproveDeposit(intent.id, intent.paymentCode)}
                            className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/20"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
