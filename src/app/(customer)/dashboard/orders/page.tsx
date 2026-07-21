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
import {
  Search,
  Plus,
  ArrowRight,
  Inbox,
  Loader2,
} from "lucide-react";
import { formatCurrency, formatShortDate, ORDER_STATUS, type OrderStatus } from "@/lib/constants";

interface OrderData {
  id: string;
  orderNumber: string;
  serviceName: string;
  priceOptionName: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders);
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách đơn hàng:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statuses = [
    { value: "all", label: "Tất cả" },
    { value: ORDER_STATUS.IN_PROGRESS, label: "Đang xử lý" },
    { value: ORDER_STATUS.COMPLETED_WAITING_CONFIRM, label: "Chờ xác nhận" },
    { value: ORDER_STATUS.COMPLETED, label: "Hoàn tất" },
    { value: ORDER_STATUS.WAITING_ADMIN_ACCEPT, label: "Chờ duyệt" },
    { value: ORDER_STATUS.PENDING_PAYMENT, label: "Chờ thanh toán" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Đơn hàng của tôi</h1>
          <p className="text-muted-foreground text-sm">
            Quản lý và xem tiến độ các gói cày thuê bạn đã đăng ký.
          </p>
        </div>
        <Link href="/order/create">
          <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold">
            <Plus className="mr-2 h-4 w-4" /> Tạo đơn hàng
          </Button>
        </Link>
      </div>

      {/* Filters Card */}
      <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã đơn hoặc tên dịch vụ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((item) => (
              <Button
                key={item.value}
                type="button"
                variant={statusFilter === item.value ? "default" : "outline"}
                onClick={() => setStatusFilter(item.value)}
                className="text-xs h-9"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table/Content */}
      {loading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="border-border/50 p-12 text-center">
          <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Inbox className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Không tìm thấy đơn hàng</h3>
              <p className="text-sm text-muted-foreground">
                Hãy thử đổi từ khóa tìm kiếm hoặc lọc theo trạng thái khác.
              </p>
            </div>
            <Link href="/order/create">
              <Button className="mt-2 text-xs">Đặt đơn hàng đầu tiên</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[120px]">Mã đơn hàng</TableHead>
                  <TableHead>Dịch vụ</TableHead>
                  <TableHead>Gói cước</TableHead>
                  <TableHead className="w-[150px]">Chi phí</TableHead>
                  <TableHead className="w-[150px]">Ngày đặt</TableHead>
                  <TableHead className="w-[150px]">Trạng thái</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="group hover:bg-muted/30 transition-colors"
                      style={{ contentVisibility: "auto" }}
                    >
                      <TableCell className="font-mono font-bold text-xs">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {order.serviceName}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {order.priceOptionName}
                      </TableCell>
                      <TableCell className="font-bold text-sm">
                        {formatCurrency(order.amount)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatShortDate(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
