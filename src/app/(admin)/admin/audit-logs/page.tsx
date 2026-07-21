"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { formatDate } from "@/lib/constants";

interface AuditLog {
  id: string;
  adminName: string;
  action: string;
  target: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const res = await fetch("/api/admin/audit-logs");
        const data = await res.json();
        if (data.success) {
          setLogs(data.logs);
        }
      } catch (err) {
        console.error("Lỗi lấy nhật ký an ninh:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuditLogs();
  }, []);

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs hệ thống</h1>
        <p className="text-slate-400 text-sm">
          Nhật ký hoạt động ghi lại tự động các hành động quản trị nhạy cảm (xem mật khẩu, sửa số
          dư).
        </p>
      </div>

      <Card className="border-slate-800 bg-slate-950">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-slate-200">Nhật ký truy cập nhạy cảm</CardTitle>
          <CardDescription className="text-slate-500 text-xs">
            Lịch sử lưu vết bảo mật không thể chỉnh sửa xóa bỏ
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Không có nhật ký hoạt động nào được ghi nhận.
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="pl-6 w-[150px] text-slate-400">Hành động</TableHead>
                    <TableHead className="text-slate-400">Quản trị viên</TableHead>
                    <TableHead className="text-slate-400">Đối tượng ảnh hưởng</TableHead>
                    <TableHead className="text-slate-400">Chi tiết chiết xuất</TableHead>
                    <TableHead className="text-slate-400">IP truy cập</TableHead>
                    <TableHead className="pr-6 text-slate-400">Thời gian ghi nhận</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="border-slate-800 hover:bg-slate-900/40">
                      <TableCell className="pl-6">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            log.action === "VIEW_CREDENTIALS"
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                          }`}
                        >
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-slate-200">
                        {log.adminName}
                      </TableCell>
                      <TableCell className="text-xs text-slate-300 font-medium font-mono">
                        {log.target}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 max-w-[200px] truncate">
                        {log.details}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">
                        {log.ipAddress || "127.0.0.1"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 pr-6">
                        {formatDate(log.createdAt)}
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
