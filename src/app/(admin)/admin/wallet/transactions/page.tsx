"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { formatCurrency, formatDate, WALLET_TX_COLORS, WALLET_TX_LABELS } from "@/lib/constants";
import type { WalletTxType } from "@/lib/constants";

interface AdminTransaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  status: string;
  createdAt: string;
}

export default function AdminWalletTransactionsPage() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch("/api/admin/wallet/transactions");
        const data = await res.json();
        if (data.success) {
          setTransactions(data.transactions);
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách giao dịch ví admin:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
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
    { value: "adjust", label: "Điều chỉnh" },
  ];

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý giao dịch ví</h1>
        <p className="text-slate-400 text-sm">
          Sổ cái ghi chép tất cả các giao dịch nạp tiền, tạm khóa thanh toán, trừ tiền cày của khách.
        </p>
      </div>

      {/* Type quick filters */}
      <Card className="border-slate-800 bg-slate-950">
        <CardContent className="p-4 flex flex-wrap gap-2">
          {txTypes.map((type) => (
            <Button
              key={type.value}
              variant={filterType === type.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(type.value)}
              className="text-xs rounded-lg border-slate-800"
            >
              {type.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <Card className="border-slate-800 bg-slate-950">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Không tìm thấy giao dịch nào.
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="pl-6 w-[120px] text-slate-400">ID Giao dịch</TableHead>
                    <TableHead className="text-slate-400">Khách hàng</TableHead>
                    <TableHead className="text-slate-400">Mô tả</TableHead>
                    <TableHead className="text-slate-400">Loại</TableHead>
                    <TableHead className="text-slate-400 text-right">Số tiền</TableHead>
                    <TableHead className="text-slate-400 text-right">Số dư ví</TableHead>
                    <TableHead className="pr-6 text-slate-400">Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => {
                    const isNegative = tx.amount < 0;
                    return (
                      <TableRow key={tx.id} className="hover:bg-slate-900 border-slate-800">
                        <TableCell className="pl-6 font-mono text-[10px] font-bold text-slate-400">
                          {tx.id.slice(-8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-semibold text-slate-200">{tx.userName}</div>
                          <div className="text-[9px] text-slate-500 font-mono">{tx.userEmail}</div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-300 font-medium">
                          {tx.description}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              WALLET_TX_COLORS[tx.type as WalletTxType] || "bg-slate-800 text-slate-400"
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
                        <TableCell
                          className={`font-bold text-xs text-right ${
                            isNegative ? "text-rose-500" : "text-emerald-500"
                          }`}
                        >
                          {isNegative ? "" : "+"}
                          {formatCurrency(tx.amount)}
                        </TableCell>
                        <TableCell className="font-bold text-xs text-slate-400 text-right">
                          {formatCurrency(tx.balance)}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
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
