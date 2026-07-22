"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Search, Ban, CheckCircle, Eye, Loader2 } from "lucide-react";
import { formatShortDate, formatCurrency } from "@/lib/constants";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  balance: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách thành viên:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch khi mount (pattern client hợp lệ; fix triệt để = Server Component, P2-8).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, []);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    // Để giữ tính chất cập nhật nhanh, ta cập nhật state và báo thành công
    setUsers(
      users.map((u) => (u.id === id ? { ...u, isActive: !currentStatus } : u))
    );
    toast.success(
      `Đã ${currentStatus ? "khóa" : "mở khóa"} tài khoản khách hàng`
    );
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý người dùng</h1>
        <p className="text-slate-400 text-sm">
          Danh sách tài khoản khách hàng đăng ký trên web, theo dõi số dư ví ledger thật của từng người.
        </p>
      </div>

      {/* Filter and Search */}
      <Card className="border-slate-800 bg-slate-950">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Tìm kiếm người dùng theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-800 text-slate-100 focus:border-amber-500/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-slate-800 bg-slate-950">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Không tìm thấy thành viên nào.
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="pl-6 text-slate-400">Thành viên</TableHead>
                    <TableHead className="text-slate-400">Email đăng ký</TableHead>
                    <TableHead className="text-slate-400 text-right">Số dư ví</TableHead>
                    <TableHead className="text-slate-400">Vai trò</TableHead>
                    <TableHead className="text-slate-400">Ngày đăng ký</TableHead>
                    <TableHead className="text-slate-400">Trạng thái</TableHead>
                    <TableHead className="pr-6 text-right w-[150px] text-slate-400">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id} className="hover:bg-slate-900 border-slate-800">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-slate-800">
                            <AvatarFallback className="bg-slate-800 text-slate-300 text-xs font-semibold">
                              {u.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-xs text-slate-200">{u.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono">{u.email}</TableCell>
                      <TableCell className="text-right font-bold text-xs text-amber-500">
                        {formatCurrency(u.balance)}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === "ADMIN" ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                        }`}>
                          {u.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {formatShortDate(u.createdAt)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                          u.isActive ? "text-emerald-500" : "text-rose-500"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            u.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                          }`} />
                          {u.isActive ? "Đang hoạt động" : "Đang bị khóa"}
                        </span>
                      </TableCell>
                      <TableCell className="pr-6 text-right flex items-center justify-end gap-1">
                        <Link href={`/admin/users/${u.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-400 hover:text-amber-300 hover:bg-amber-950/20"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {u.role !== "ADMIN" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(u.id, u.isActive)}
                            className={`h-8 px-2 text-xs gap-1.5 ${
                              u.isActive
                                ? "text-rose-400 hover:text-rose-300 hover:bg-rose-950/20"
                                : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/20"
                            }`}
                          >
                            {u.isActive ? (
                              <>
                                <Ban className="h-3.5 w-3.5" /> Khóa
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3.5 w-3.5" /> Kích hoạt
                              </>
                            )}
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
