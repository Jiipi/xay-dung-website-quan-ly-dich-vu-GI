"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { formatCurrency, formatDate, WALLET_TX_COLORS, WALLET_TX_LABELS } from "@/lib/constants";
import type { WalletTxType } from "@/lib/constants";

interface TransactionData {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  status: string;
  createdAt: string;
}

export default function CustomerWalletHistoryPage() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const [meRes, txsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/wallet/transactions"),
        ]);

        const meData = await meRes.json();
        const txsData = await txsRes.json();

        if (meData.success) {
          setBalance(meData.user.balance);
        }
        if (txsData.success) {
          setTransactions(txsData.transactions);
        }
      } catch (err) {
        console.error("Lỗi fetch lịch sử ví:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  const filteredTransactions = transactions.filter((tx) => {
    return filterType === "all" || tx.type === filterType;
  });

  const txTypes = [
    { value: "all", label: "Tất cả" },
    { value: "deposit", label: "Nạp tiền" },
    { value: "hold", label: "Tạm giữ" },
    { value: "charge", label: "Thanh toán" },
    { value: "refund", label: "Hoàn tiền" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lịch sử ví</h1>
        <p className="text-muted-foreground text-sm">
          Xem lịch sử giao dịch nạp tiền, thanh toán và hoàn trả trên tài khoản của bạn.
        </p>
      </div>

      {/* Balance Summary Card */}
      <Card className="border-border/50 bg-gradient-to-br from-blue-900 to-blue-950 border-blue-800 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <span className="text-xs text-blue-200 block">Số dư hiện dụng</span>
              <span className="text-3xl font-extrabold">{formatCurrency(balance)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/deposit">
              <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                Nạp thêm tiền
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History Table */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-lg">Danh sách giao dịch</CardTitle>
            <CardDescription className="text-xs">
              Lịch sử ghi chép dòng tiền an toàn (Ví sổ cái)
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {txTypes.map((item) => (
              <Button
                key={item.value}
                type="button"
                variant={filterType === item.value ? "default" : "outline"}
                onClick={() => setFilterType(item.value)}
                className="text-xs h-9"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Không có giao dịch nào được ghi nhận.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[80px]">Loại</TableHead>
                    <TableHead>Mô tả giao dịch</TableHead>
                    <TableHead className="w-[120px] text-right">Số tiền</TableHead>
                    <TableHead className="w-[120px] text-right">Số dư ví</TableHead>
                    <TableHead className="w-[180px]">Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => {
                    const isNegative = tx.amount < 0;
                    return (
                      <TableRow key={tx.id} className="hover:bg-muted/20">
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                              WALLET_TX_COLORS[tx.type as WalletTxType] || "bg-muted"
                            }`}
                          >
                            {isNegative ? (
                              <ArrowDownLeft className="h-3 w-3 shrink-0" />
                            ) : (
                              <ArrowUpRight className="h-3 w-3 shrink-0" />
                            )}
                            {WALLET_TX_LABELS[tx.type as WalletTxType] || tx.type}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold text-xs text-slate-300">
                          {tx.description}
                        </TableCell>
                        <TableCell
                          className={`font-bold text-sm text-right ${
                            isNegative ? "text-rose-500" : "text-emerald-500"
                          }`}
                        >
                          {isNegative ? "" : "+"}
                          {formatCurrency(tx.amount)}
                        </TableCell>
                        <TableCell className="font-bold text-xs text-slate-400 text-right">
                          {formatCurrency(tx.balance)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(tx.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
