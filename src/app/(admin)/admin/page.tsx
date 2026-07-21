"use client";

import Link from "next/link";
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
import { StatusBadge } from "@/components/shared/status-badge";
import {
  DollarSign,
  ShoppingBag,
  Users,
  Clock,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { formatCurrency, formatDate, type OrderStatus } from "@/lib/constants";

interface StatsData {
  totalRevenue: number;
  pendingOrders: number;
  activeOrders: number;
  totalOrders: number;
  totalUsers: number;
  recentDeposits: {
    id: string;
    userName: string;
    userEmail: string;
    amount: number;
    createdAt: string;
  }[];
}

interface OrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  serviceName: string;
  priceOptionName: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
}

interface AuditLogData {
  id: string;
  adminName: string;
  action: string;
  target: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderData[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLogData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const [statsRes, ordersRes, logsRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/orders"),
          fetch("/api/admin/audit-logs"),
        ]);

        const statsData = await statsRes.json();
        const ordersData = await ordersRes.json();
        const logsData = await logsRes.json();

        if (statsData.success) setStats(statsData.stats);
        if (ordersData.success) setRecentOrders(ordersData.orders.slice(0, 4));
        if (logsData.success) setRecentLogs(logsData.logs.slice(0, 4));
      } catch (err) {
        console.error("Lỗi lấy dữ liệu dashboard admin:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Hệ thống tổng quan</h1>
        <p className="text-slate-400 text-sm">
          Phân tích doanh thu, trạng thái đơn hàng và hoạt động hệ thống hôm nay.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card className="border-slate-800 bg-slate-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Doanh thu thực tế
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {formatCurrency(stats?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tính trên dòng tiền hoàn tất thực tế
            </p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="border-slate-800 bg-slate-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Tổng số đơn đặt
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {stats?.totalOrders || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tất cả các trạng thái đơn hàng
            </p>
          </CardContent>
        </Card>

        {/* Active Orders */}
        <Card className="border-slate-800 bg-slate-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Đơn đang thực hiện
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {stats?.activeOrders || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Đang cày cuốc, săn boss, event
            </p>
          </CardContent>
        </Card>

        {/* Total Users */}
        <Card className="border-slate-800 bg-slate-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Số lượng thành viên
            </CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {stats?.totalUsers || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Khách hàng đăng ký trên web
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders Table */}
        <Card className="border-slate-800 bg-slate-950 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base text-slate-100">Đơn hàng mới nhận gần đây</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Theo dõi tình trạng tiếp nhận đơn cày thuê mới nhất
              </CardDescription>
            </div>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm" className="text-xs text-amber-500 hover:text-amber-400">
                Xem tất cả
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                Chưa có đơn hàng nào trong hệ thống.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="border-slate-800">
                    <TableRow className="hover:bg-transparent border-slate-800">
                      <TableHead className="text-slate-400 text-xs">Mã đơn</TableHead>
                      <TableHead className="text-slate-400 text-xs">Khách hàng</TableHead>
                      <TableHead className="text-slate-400 text-xs">Dịch vụ</TableHead>
                      <TableHead className="text-slate-400 text-xs">Doanh thu</TableHead>
                      <TableHead className="text-slate-400 text-xs">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-slate-900/50 border-slate-800">
                        <TableCell className="font-mono text-xs font-bold text-slate-300">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-slate-300">
                          {order.customerName}
                        </TableCell>
                        <TableCell className="text-xs text-slate-400">
                          {order.serviceName}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-300">
                          {formatCurrency(order.amount)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Audit Logs (Security) */}
        <Card className="border-slate-800 bg-slate-950">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base text-slate-100 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500 animate-pulse" /> Nhật ký an toàn
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Ghi vết giải mã thông tin tài khoản
              </CardDescription>
            </div>
            <Link href="/admin/audit-logs">
              <Button variant="ghost" size="sm" className="text-xs text-amber-500 hover:text-amber-400">
                Chi tiết
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                Chưa phát sinh nhật ký bảo mật.
              </div>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 border border-slate-800/80 rounded-lg bg-slate-900/50 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-amber-500">{log.adminName}</span>
                      <span className="text-[9px] text-slate-500">{formatDate(log.createdAt)}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{log.details}</p>
                    <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1">
                      <span>Thao tác: {log.action}</span>
                      <span>IP: {log.ipAddress}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
