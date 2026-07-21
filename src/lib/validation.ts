import { z } from "zod";

/* ============================================================================
 *  AUTH
 * ========================================================================== */

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .email("Email không hợp lệ");

export const passwordField = z
  .string()
  .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
  .max(200, "Mật khẩu quá dài");

/** Schema đăng ký khách hàng. */
export const registerSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập họ tên").max(100, "Họ tên quá dài"),
  email: emailField,
  password: passwordField,
});
export type RegisterInput = z.infer<typeof registerSchema>;

/** Schema đăng nhập. */
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Schema đổi mật khẩu. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Mật khẩu mới phải khác mật khẩu hiện tại",
    path: ["newPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** Schema quên mật khẩu. */
export const forgotPasswordSchema = z.object({ email: emailField });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/** Schema đặt lại mật khẩu bằng token. */
export const resetPasswordSchema = z
  .object({ token: z.string().min(1), password: passwordField })
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/* ============================================================================
 *  PROFILE
 * ========================================================================== */

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập họ tên")
    .max(100, "Họ tên quá dài"),
  avatar: z.string().url("URL avatar không hợp lệ").optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(/^(\+84|0)\d{9,10}$/, "Số điện thoại không hợp lệ")
    .optional()
    .or(z.literal("")),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/* ============================================================================
 *  WALLET / DEPOSIT
 * ========================================================================== */

export const PRESET_AMOUNTS = [50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000] as const;

export const depositSchema = z.object({
  amount: z
    .number()
    .int("Số tiền phải là số nguyên")
    .positive("Số tiền phải lớn hơn 0")
    .min(10_000, "Số tiền tối thiểu 10.000đ")
    .max(50_000_000, "Số tiền tối đa 50.000.000đ"),
});
export type DepositInput = z.infer<typeof depositSchema>;

/* ============================================================================
 *  ORDERS
 * ========================================================================== */

/** Server của Genshin Impact. */
export const GENSHIN_SERVERS = ["Asia", "Europe", "America", "TW/HK/MO"] as const;
export type GenshinServer = (typeof GENSHIN_SERVERS)[number];

export const createOrderSchema = z.object({
  serviceId: z.string().min(1, "Vui lòng chọn dịch vụ"),
  priceOptionId: z.string().min(1, "Vui lòng chọn gói"),
  uid: z
    .string()
    .trim()
    .regex(/^\d{9}$/, "UID phải gồm đúng 9 chữ số"),
  server: z.enum(GENSHIN_SERVERS, {
    message: "Server không hợp lệ",
  }),
  note: z.string().trim().max(500, "Ghi chú quá dài").optional(),
  gamePassword: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu game")
    .max(100, "Mật khẩu quá dài"),
  couponCode: z
    .string()
    .trim()
    .toUpperCase()
    .max(40, "Mã giảm giá quá dài")
    .optional()
    .or(z.literal("")),
  paymentMethod: z.enum(["WALLET", "PAYOS"], {
    message: "Phương thức thanh toán không hợp lệ",
  }),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.string().min(1, "Vui lòng chọn trạng thái"),
  note: z.string().trim().max(500).optional(),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const orderMessageSchema = z.object({
  orderId: z.string().min(1),
  message: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập nội dung")
    .max(2000, "Tin nhắn quá dài"),
  attachments: z
    .array(z.string().url())
    .max(5, "Tối đa 5 tệp đính kèm")
    .optional(),
});
export type OrderMessageInput = z.infer<typeof orderMessageSchema>;

/* ============================================================================
 *  COUPONS / PROMOTIONS
 * ========================================================================== */

export const applyCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, "Mã giảm giá không hợp lệ")
    .max(40),
  orderAmount: z.number().positive(),
});
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;

export const createCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2)
    .max(40)
    .regex(/^[A-Z0-9_-]+$/, "Mã chỉ gồm chữ in hoa, số, _ và -"),
  description: z.string().max(500).optional(),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discount: z.number().positive("Giá trị giảm phải lớn hơn 0"),
  maxDiscount: z.number().positive().optional(),
  minOrderValue: z.number().nonnegative().default(0),
  usageLimit: z.number().int().positive().optional(),
  usagePerUser: z.number().int().positive().default(1),
  appliesToAll: z.boolean().default(true),
  serviceIds: z.array(z.string()).default([]),
  categoryIds: z.array(z.string()).default([]),
  expiresAt: z.coerce.date().refine((d) => d > new Date(), {
    message: "Ngày hết hạn phải ở tương lai",
  }),
});
export type CreateCouponInput = z.infer<typeof createCouponSchema>;

/* ============================================================================
 *  REVIEWS
 * ========================================================================== */

export const createReviewSchema = z.object({
  orderId: z.string().min(1),
  rating: z
    .number()
    .int("Đánh giá phải là số nguyên")
    .min(1, "Đánh giá tối thiểu 1 sao")
    .max(5, "Đánh giá tối đa 5 sao"),
  content: z
    .string()
    .trim()
    .min(10, "Vui lòng nhập ít nhất 10 ký tự")
    .max(1000, "Nội dung quá dài"),
  images: z
    .array(z.string().url())
    .max(5, "Tối đa 5 hình ảnh")
    .default([]),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const moderateReviewSchema = z.object({
  reviewId: z.string().min(1),
  status: z.enum(["APPROVED", "REJECTED"]),
  adminReply: z.string().trim().max(500).optional(),
});
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;

/* ============================================================================
 *  REFUNDS / DISPUTES
 * ========================================================================== */

export const refundReasons = [
  "DỊCH_VỤ_KHÔNG_THỰC_HIỆN",
  "KẾT_QUẢ_KHÔNG_ĐÚNG_YÊU_CẦU",
  "TÀI_KHOẢN_BỊ_KHÓA",
  "KHÁCH_HÀNG_THAY_ĐỔI_Ý_KIẾN",
  "LỖI_KỸ_THUẬT",
  "KHÁC",
] as const;

export const createRefundRequestSchema = z.object({
  orderId: z.string().min(1),
  reason: z.enum(refundReasons, {
    message: "Lý do hoàn tiền không hợp lệ",
  }),
  description: z.string().trim().max(1000).optional(),
  evidence: z
    .array(z.string().url())
    .min(1, "Vui lòng đính kèm ít nhất 1 bằng chứng")
    .max(10),
});
export type CreateRefundRequestInput = z.infer<typeof createRefundRequestSchema>;

export const processRefundSchema = z.object({
  refundId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  resolution: z.string().trim().max(500).optional(),
  refundAmount: z.number().positive().optional(),
});
export type ProcessRefundInput = z.infer<typeof processRefundSchema>;

/* ============================================================================
 *  CONVERSATIONS (pre-sale chat)
 * ========================================================================== */

export const startConversationSchema = z.object({
  subject: z.string().trim().max(120).optional(),
  initialMessage: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập nội dung")
    .max(2000),
});
export type StartConversationInput = z.infer<typeof startConversationSchema>;

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  content: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập nội dung")
    .max(2000),
  attachments: z
    .array(z.string().url())
    .max(5)
    .optional(),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

/* ============================================================================
 *  NOTIFICATIONS
 * ========================================================================== */

export const createNotificationSchema = z.object({
  userId: z.string().min(1),
  type: z.string().min(1),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(1000),
  href: z.string().url().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

export const markNotificationReadSchema = z.object({
  notificationId: z.string().min(1),
});
export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;

/* ============================================================================
 *  SERVICE / CATALOG (admin)
 * ========================================================================== */

export const createServiceSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
  categoryId: z.string().min(1),
  difficulty: z
    .enum(["Dễ", "Trung bình", "Khó", "Rất khó"])
    .optional(),
  estimatedTime: z.string().trim().max(100).optional(),
  isPopular: z.boolean().default(false),
  imageUrl: z.string().url().optional().or(z.literal("")),
  requirements: z.string().trim().max(2000).optional(),
  priceOptions: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(100),
        price: z.number().positive(),
        originalPrice: z.number().positive().optional(),
        description: z.string().trim().max(500).optional(),
      }),
    )
    .min(1, "Phải có ít nhất 1 gói giá"),
  tagIds: z.array(z.string()).default([]),
});
export type CreateServiceInput = z.infer<typeof createServiceSchema>;

export const createCategorySchema = z.object({
  id: z
    .string()
    .trim()
    .min(2, "ID tối thiểu 2 ký tự")
    .max(40)
    .regex(/^[a-z0-9-]+$/, "ID chỉ gồm chữ thường, số và -"),
  name: z.string().trim().min(1).max(100),
  icon: z.string().trim().min(1).max(40),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

/* ============================================================================
 *  BLOG / ARTICLES
 * ========================================================================== */

export const createArticleSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug chỉ gồm chữ thường, số và -"),
  title: z.string().trim().min(1).max(200),
  excerpt: z.string().trim().max(500).optional(),
  content: z.string().min(1, "Vui lòng nhập nội dung"),
  coverImage: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});
export type CreateArticleInput = z.infer<typeof createArticleSchema>;

/* ============================================================================
 *  FAQ
 * ========================================================================== */

export const createFaqItemSchema = z.object({
  categoryId: z.string().min(1),
  question: z.string().trim().min(1).max(200),
  answer: z.string().trim().min(1).max(2000),
  order: z.number().int().nonnegative().default(0),
});
export type CreateFaqItemInput = z.infer<typeof createFaqItemSchema>;

/* ============================================================================
 *  ADMIN / USER MANAGEMENT
 * ========================================================================== */

export const adjustBalanceSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().refine((v) => v !== 0, {
    message: "Số tiền phải khác 0",
  }),
  description: z.string().trim().min(1, "Vui lòng nhập lý do").max(200),
});
export type AdjustBalanceInput = z.infer<typeof adjustBalanceSchema>;

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["CUSTOMER", "ADMIN"]),
});
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export const toggleUserActiveSchema = z.object({
  userId: z.string().min(1),
  isActive: z.boolean(),
});
export type ToggleUserActiveInput = z.infer<typeof toggleUserActiveSchema>;

/* ============================================================================
 *  GENERIC HELPERS
 * ========================================================================== */

/** Pagination query. */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
export type PaginationInput = z.infer<typeof paginationSchema>;

/** Coerce FormData / unknown thành object rồi validate. */
export async function parseFormData<T extends z.ZodTypeAny>(
  schema: T,
  data: FormData | Record<string, unknown>,
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; error: string }> {
  const raw: Record<string, unknown> =
    data instanceof FormData
      ? Object.fromEntries(data.entries())
      : data;
  // Numeric/array inputs thường cần coerce thủ công.
  for (const key of Object.keys(raw)) {
    const value = raw[key];
    if (typeof value === "string") {
      if (value === "true" || value === "false") raw[key] = value === "true";
      else if (/^\d+(\.\d+)?$/.test(value) && key !== "uid" && key !== "code") {
        const num = Number(value);
        if (!Number.isNaN(num)) raw[key] = num;
      }
    }
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    return {
      ok: false,
      error: first?.message ?? "Dữ liệu không hợp lệ",
    };
  }
  return { ok: true, data: result.data };
}
