"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BellOff, Info, CheckCircle, AlertTriangle, XCircle, ArrowRight, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/constants";
import type { Notification } from "@/lib/types";

const notiIconMap = {
  info: <Info className="h-5 w-5 text-blue-500" />,
  success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  error: <XCircle className="h-5 w-5 text-destructive" />,
};

export default function CustomerNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        if (data.success) setNotifications(data.notifications);
      } catch (err) {
        console.error("Lỗi lấy thông báo:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkAllRead = () => {
    setNotifications(
      notifications.map((n) => ({ ...n, isRead: true }))
    );
    toast.success("Đã đánh dấu đọc tất cả thông báo.");
  };

  const handleMarkOneRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleDeleteNoti = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setNotifications(notifications.filter((n) => n.id !== id));
    toast.success("Đã xóa thông báo");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thông báo</h1>
          <p className="text-muted-foreground text-sm">
            Xem tất cả các tin nhắn hệ thống gửi đến liên quan tới đơn hàng và ví tiền của bạn.
          </p>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Đọc tất cả
          </Button>
        )}
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0 divide-y divide-border/60">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground flex flex-col items-center justify-center">
              <BellOff className="h-10 w-10 mb-2 stroke-1" />
              <p className="text-sm">Hộp thư thông báo trống.</p>
            </div>
          ) : (
            notifications.map((noti) => (
              <div
                key={noti.id}
                onClick={() => handleMarkOneRead(noti.id)}
                className={`p-4 flex gap-4 hover:bg-muted/30 transition-colors cursor-pointer relative ${
                  !noti.isRead ? "bg-primary/5 border-l-2 border-primary" : ""
                }`}
              >
                <div className="shrink-0 pt-0.5">
                  {notiIconMap[noti.type] || <Info className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <h3 className={`text-sm ${!noti.isRead ? "font-bold" : "font-medium"}`}>
                      {noti.title}
                    </h3>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatDate(noti.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {noti.message}
                  </p>
                  {noti.link && (
                    <Link
                      href={noti.link}
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-2"
                    >
                      Xem chi tiết <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
                <button
                  onClick={(e) => handleDeleteNoti(noti.id, e)}
                  className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1 rounded-md"
                >
                  <span className="text-xs">Xóa</span>
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
