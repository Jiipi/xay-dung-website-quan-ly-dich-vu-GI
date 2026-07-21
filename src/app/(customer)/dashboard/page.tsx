"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Wallet,
  ShoppingBag,
  ArrowRight,
  Clock,
  Plus,
  History,
  Zap,
  Loader2,
} from "lucide-react";
import { formatCurrency, formatDate, type OrderStatus } from "@/lib/constants";

interface UserProfile {
  name: string;
  email: string;
  balance: number;
}

interface OrderData {
  id: string;
  orderNumber: string;
  serviceName: string;
  priceOptionName: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
}

interface TransactionData {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  status: string;
  createdAt: string;
}

export default function CustomerDashboardOverview() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [userRes, ordersRes, txsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/orders"),
          fetch("/api/wallet/transactions"),
        ]);

        const userData = await userRes.json();
        const ordersData = await ordersRes.json();
        const txsData = await txsRes.json();

        if (userData.success) setUser(userData.user);
        if (ordersData.success) setOrders(ordersData.orders);
        if (txsData.success) setTransactions(txsData.transactions);
      } catch (err) {
        console.error("Lỗi fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const activeOrders = orders.filter(
    (o) => !["completed", "cancelled", "refunded"].includes(o.status)
  );

  const completedCount = orders.filter((o) => o.status === "completed").length;
  const recentTransactions = transactions.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Chào quay trở lại, {user?.name || "Khách hàng"}!
          </h1>
          <p className="text-muted-foreground text-sm">
            Theo dõi trạng thái dịch vụ và quản lý ví của bạn tại đây.
          </p>
        </div>
        <Link href="/order/create">
          <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold">
            <Plus className="mr-2 h-4 w-4" /> Đặt dịch vụ mới
          </Button>
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Wallet Balance */}
        <Card className="bg-gradient-to-br from-blue-900 to-blue-950 border-blue-800 text-white relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-200">
              Số dư tài khoản
            </CardTitle>
            <Wallet className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(user?.balance || 0)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Link
                href="/dashboard/deposit"
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center group-hover:translate-x-1 transition-transform"
              >
                Nạp tiền ngay <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Active Orders */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đơn hàng đang xử lý
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Đang làm La Hoàn, Farm, Event...
            </p>
          </CardContent>
        </Card>

        {/* Completed Orders */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đơn hàng hoàn tất
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cảm ơn bạn đã tin dùng dịch vụ
            </p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng số đơn đặt
            </CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tích lũy từ lúc tạo tài khoản
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Orders List */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">Đơn hàng đang xử lý</CardTitle>
            </div>
            <Link href="/dashboard/orders">
              <Button variant="ghost" size="sm" className="text-xs">
                Xem tất cả
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {activeOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
                Không có đơn hàng nào đang trong quá trình thực hiện.
              </div>
            ) : (
              <div className="space-y-4">
                {activeOrders.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">
                          {order.orderNumber}
                        </span>
                        <h4 className="font-semibold text-sm truncate">
                          {order.serviceName}
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        Gói: {order.priceOptionName} • {formatCurrency(order.amount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={order.status} />
                      <Link href={`/dashboard/orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          Chi tiết
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">Giao dịch ví gần đây</CardTitle>
            </div>
            <Link href="/dashboard/wallet">
              <Button variant="ghost" size="sm" className="text-xs">
                Xem chi tiết
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
                Chưa có giao dịch tài chính nào phát sinh.
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((tx) => {
                  const isNegative = tx.amount < 0;
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 border rounded-xl"
                    >
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm leading-none">
                          {tx.description}
                        </h4>
                        <div className="flex items-center gap-1.5">
                          <History className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(tx.createdAt)}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-bold ${
                          isNegative ? "text-rose-500" : "text-emerald-500"
                        }`}
                      >
                        {isNegative ? "" : "+"}
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
