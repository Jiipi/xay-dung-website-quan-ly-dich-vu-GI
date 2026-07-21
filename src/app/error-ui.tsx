"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertCircle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface RouteErrorProps {
  error: Error & { digest?: string };
  reset?: () => void;
  /** Tiêu đề hiển thị phía trên icon (VD: "Lỗi tải dashboard"). */
  title?: string;
  /** CTA phụ (mặc định: về trang chủ). */
  homeHref?: string;
  homeLabel?: string;
}

/**
 * Shared error UI — dùng chung cho error.tsx các route group.
 * Phải là "use client" vì Next.js yêu cầu error boundary là client component.
 */
export function RouteError({
  error,
  reset,
  title = "Đã xảy ra lỗi",
  homeHref = "/",
  homeLabel = "Về trang chủ",
}: RouteErrorProps) {
  useEffect(() => {
     
    console.error("route_error", {
      message: error?.message,
      digest: error?.digest,
      stack: error?.stack?.slice(0, 500),
    });
  }, [error]);

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500 mx-auto">
          <AlertCircle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">
            Hệ thống gặp sự cố khi xử lý yêu cầu. Đội ngũ kỹ thuật đã được
            thông báo. Vui lòng thử lại hoặc quay về trang chủ.
          </p>
        </div>

        {error?.digest && (
          <p className="text-xs text-muted-foreground/60 font-mono">
            Mã lỗi: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          {reset && (
            <Button onClick={() => reset()} variant="default">
              <RotateCcw className="mr-2 h-4 w-4" />
              Thử lại
            </Button>
          )}
          <Link href={homeHref}>
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" />
              {homeLabel}
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
