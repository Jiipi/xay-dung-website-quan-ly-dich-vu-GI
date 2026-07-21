"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ArrowRight, Inbox, Loader2 } from "lucide-react";
import { formatCurrency, formatShortDate, ORDER_STATUS, type OrderStatus } from "@/lib/constants";

interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  priceOptionName: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/admin/orders");
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders);
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách đơn hàng admin:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statuses = [
    { value: "all", label: "Tất cả" },
    { value: ORDER_STATUS.WAITING_ADMIN_ACCEPT, label: "Chờ nhận đơn" },
    { value: ORDER_STATUS.IN_PROGRESS, label: "Đang xử lý" },
    { value: ORDER_STATUS.COMPLETED_WAITING_CONFIRM, label: "Chờ xác nhận" },
    { value: ORDER_STATUS.COMPLETED, label: "Hoàn tất" },
    { value: ORDER_STATUS.PENDING_PAYMENT, label: "Chờ t.toán" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Quản lý đơn hàng</h1>
        <p className="text-slate-400 text-sm">
          Tiếp nhận đơn cày thuê mới, cập nhật tiến độ, xem mật khẩu và chat trực tuyến với khách.
        </p>
      </div>

      {/* Filters */}
      <Card className="border-slate-800 bg-slate-950">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Tìm theo mã đơn, khách hàng, tên dịch vụ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-800 focus:border-amber-500/50 text-slate-100"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
            {statuses.map((status) => (
              <Button
                key={status.value}
                variant={statusFilter === status.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status.value)}
                className="rounded-lg whitespace-nowrap text-xs border-slate-800"
              >
                {status.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="border-slate-800 bg-slate-950 p-12 text-center">
          <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
            <Inbox className="h-10 w-10 text-slate-600" />
            <h3 className="font-semibold text-slate-200">Không tìm thấy đơn hàng nào</h3>
            <p className="text-xs text-slate-500">
              Không có đơn hàng nào khớp với bộ lọc hiện tại của bạn.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="border-slate-800 bg-slate-950 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-slate-800">
                <TableRow className="hover:bg-transparent border-slate-800">
                  <TableHead className="text-slate-400 text-xs w-[120px]">Mã đơn</TableHead>
                  <TableHead className="text-slate-400 text-xs">Khách hàng</TableHead>
                  <TableHead className="text-slate-400 text-xs">Dịch vụ</TableHead>
                  <TableHead className="text-slate-400 text-xs">Gói cước</TableHead>
                  <TableHead className="text-slate-400 text-xs w-[120px]">Chi phí</TableHead>
                  <TableHead className="text-slate-400 text-xs w-[120px]">Ngày đặt</TableHead>
                  <TableHead className="text-slate-400 text-xs w-[120px]">Trạng thái</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-slate-900 border-slate-800 group">
                    <TableCell className="font-mono text-xs font-bold text-slate-300">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-semibold text-slate-200">{order.customerName}</div>
                      <div className="text-[10px] text-slate-500">{order.customerEmail}</div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-300">
                      {order.serviceName}
                    </TableCell>
                    <TableCell className="text-[11px] text-slate-500">
                      {order.priceOptionName}
                    </TableCell>
                    <TableCell className="font-bold text-xs text-slate-300">
                      {formatCurrency(order.amount)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatShortDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-500 hover:text-amber-400 hover:bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
