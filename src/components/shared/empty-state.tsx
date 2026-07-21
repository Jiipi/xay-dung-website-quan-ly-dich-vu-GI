import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Nút hành động hoặc nội dung tùy chỉnh hiển thị bên dưới mô tả */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Trạng thái rỗng dùng chung: icon trong vòng tròn gradient nhẹ + tiêu đề + mô tả + hành động.
 * Dùng khi danh sách/bảng không có dữ liệu (đơn hàng, giao dịch ví, thông báo...).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-16",
        className
      )}
      role="status"
    >
      {Icon && (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-amber-500/10 ring-1 ring-border">
          <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
