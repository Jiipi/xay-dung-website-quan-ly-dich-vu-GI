import type { OrderStatus, WalletTxType, ServiceCategory } from "./constants";

// ===== USER =====
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "CUSTOMER" | "ADMIN";
  createdAt: string;
  isActive: boolean;
}

// ===== SERVICE =====
export interface ServicePriceOption {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  priceOptions: ServicePriceOption[];
  difficulty?: "Dễ" | "Trung bình" | "Khó" | "Rất khó";
  estimatedTime?: string;
  isPopular?: boolean;
  isActive: boolean;
  imageUrl?: string;
  requirements?: string;
}

// ===== ORDER =====
export interface OrderStatusLog {
  id: string;
  status: OrderStatus;
  note?: string;
  createdAt: string;
  createdBy: string;
}

export interface OrderMessage {
  id: string;
  message: string;
  senderRole: "CUSTOMER" | "ADMIN";
  senderName: string;
  createdAt: string;
  attachments?: string[];
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  serviceId: string;
  serviceName: string;
  priceOptionName: string;
  amount: number;
  status: OrderStatus;
  uid: string;
  server: string;
  note?: string;
  statusLogs: OrderStatusLog[];
  messages: OrderMessage[];
  resultImages?: string[];
  createdAt: string;
  updatedAt: string;
}

// ===== WALLET =====
export interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletTxType;
  amount: number;
  balance: number; // running balance (computed)
  description: string;
  orderId?: string;
  status: "success" | "pending" | "failed";
  createdAt: string;
}

// ===== PAYMENT =====
export interface PaymentIntent {
  id: string;
  userId: string;
  amount: number;
  status: "pending" | "completed" | "expired" | "cancelled";
  paymentCode: string;
  qrCodeUrl?: string;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    content: string;
  };
  expiresAt: string;
  createdAt: string;
}

// ===== NOTIFICATION =====
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// ===== AUDIT LOG =====
export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  target: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

// ===== STATS =====
export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  todayRevenue: number;
  totalRevenue: number;
  totalCustomers: number;
  revenueData: { month: string; revenue: number; orders: number }[];
}
