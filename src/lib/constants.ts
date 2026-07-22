// ===== ORDER STATUS =====
export const ORDER_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  PAID_WAITING_ACCOUNT: "paid_waiting_account",
  WAITING_ADMIN_ACCEPT: "waiting_admin_accept",
  IN_PROGRESS: "in_progress",
  NEED_CUSTOMER_ACTION: "need_customer_action",
  PAUSED: "paused",
  COMPLETED_WAITING_CONFIRM: "completed_waiting_confirm",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Chờ thanh toán",
  paid_waiting_account: "Đã thanh toán",
  waiting_admin_accept: "Chờ nhận đơn",
  in_progress: "Đang xử lý",
  need_customer_action: "Cần xác minh",
  paused: "Tạm dừng",
  completed_waiting_confirm: "Chờ xác nhận",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  refunded: "Đã hoàn tiền",
};

export const ORDER_STATUS_COLORS: Record<
  OrderStatus,
  { bg: string; text: string; dot: string }
> = {
  pending_payment: {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    dot: "bg-slate-500",
  },
  paid_waiting_account: {
    bg: "bg-blue-50 dark:bg-blue-950",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  waiting_admin_accept: {
    bg: "bg-indigo-50 dark:bg-indigo-950",
    text: "text-indigo-700 dark:text-indigo-300",
    dot: "bg-indigo-500",
  },
  in_progress: {
    bg: "bg-cyan-50 dark:bg-cyan-950",
    text: "text-cyan-700 dark:text-cyan-300",
    dot: "bg-cyan-500",
  },
  need_customer_action: {
    bg: "bg-amber-50 dark:bg-amber-950",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  paused: {
    bg: "bg-orange-50 dark:bg-orange-950",
    text: "text-orange-700 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  completed_waiting_confirm: {
    bg: "bg-purple-50 dark:bg-purple-950",
    text: "text-purple-700 dark:text-purple-300",
    dot: "bg-purple-500",
  },
  completed: {
    bg: "bg-emerald-50 dark:bg-emerald-950",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  cancelled: {
    bg: "bg-red-50 dark:bg-red-950",
    text: "text-red-700 dark:text-red-300",
    dot: "bg-red-500",
  },
  refunded: {
    bg: "bg-pink-50 dark:bg-pink-950",
    text: "text-pink-700 dark:text-pink-300",
    dot: "bg-pink-500",
  },
};

// ===== WALLET TRANSACTION TYPES =====
export const WALLET_TX_TYPE = {
  DEPOSIT: "deposit",
  HOLD: "hold",
  CHARGE: "charge",
  REFUND: "refund",
  ADJUSTMENT: "adjustment",
  BONUS: "bonus",
} as const;

export type WalletTxType = (typeof WALLET_TX_TYPE)[keyof typeof WALLET_TX_TYPE];

export const WALLET_TX_LABELS: Record<WalletTxType, string> = {
  deposit: "Nạp tiền",
  hold: "Tạm giữ",
  charge: "Thanh toán",
  refund: "Hoàn tiền",
  adjustment: "Điều chỉnh",
  bonus: "Thưởng",
};

export const WALLET_TX_COLORS: Record<WalletTxType, string> = {
  deposit: "text-emerald-600 dark:text-emerald-400",
  hold: "text-amber-600 dark:text-amber-400",
  charge: "text-red-600 dark:text-red-400",
  refund: "text-blue-600 dark:text-blue-400",
  adjustment: "text-purple-600 dark:text-purple-400",
  bonus: "text-cyan-600 dark:text-cyan-400",
};

// ===== SERVICE CATEGORIES =====
export const SERVICE_CATEGORIES = [
  { id: "endgame", name: "Endgame", icon: "⚔️" },
  { id: "gacha", name: "Gacha", icon: "🎲" },
  { id: "farm", name: "Farm", icon: "🌾" },
  { id: "map", name: "Map", icon: "🗺️" },
  { id: "event", name: "Sự kiện", icon: "🎉" },
  { id: "custom", name: "Tùy chỉnh", icon: "✨" },
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]["id"];

// ===== GAME SERVERS =====
export const GAME_SERVERS = [
  { value: "Asia", label: "Asia" },
  { value: "Europe", label: "Europe" },
  { value: "America", label: "America" },
  { value: "TW_HK_MO", label: "TW/HK/MO" },
] as const;

// ===== NAVIGATION =====
export const CUSTOMER_NAV = [
  { label: "Tổng quan", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Đơn hàng", href: "/dashboard/orders", icon: "ShoppingBag" },
  { label: "Nạp tiền", href: "/dashboard/deposit", icon: "Wallet" },
  { label: "Lịch sử ví", href: "/dashboard/wallet", icon: "Receipt" },
  { label: "Hồ sơ", href: "/dashboard/profile", icon: "User" },
  { label: "Thông báo", href: "/dashboard/notifications", icon: "Bell" },
] as const;

export const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { label: "Đơn hàng", href: "/admin/orders", icon: "ShoppingBag" },
  { label: "Khiếu nại", href: "/admin/refunds", icon: "RotateCcw" },
  { label: "Dịch vụ", href: "/admin/services", icon: "Package" },
  { label: "Khách hàng", href: "/admin/users", icon: "Users" },
  { label: "Giao dịch ví", href: "/admin/wallet/transactions", icon: "Receipt" },
  { label: "Nạp tiền", href: "/admin/deposits", icon: "CreditCard" },
  { label: "Trang tĩnh", href: "/admin/pages", icon: "Layout" },
  { label: "Audit Log", href: "/admin/audit-logs", icon: "FileText" },
  { label: "Cài đặt", href: "/admin/settings", icon: "Settings" },
] as const;

// ===== DEPOSIT AMOUNTS =====
export const QUICK_DEPOSIT_AMOUNTS = [
  50_000, 100_000, 200_000, 500_000, 1_000_000,
] as const;

// ===== FORMAT HELPERS =====
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatShortDate(date: Date | string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}
