import { Loader2 } from "lucide-react";

/**
 * Loading UI fallback cho route groups.
 * Hiển thị spinner đơn giản — không phải child component,
 * không tốn layout overhead.
 */
export default function Loading() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="text-sm text-muted-foreground">Đang tải…</p>
      </div>
    </div>
  );
}
