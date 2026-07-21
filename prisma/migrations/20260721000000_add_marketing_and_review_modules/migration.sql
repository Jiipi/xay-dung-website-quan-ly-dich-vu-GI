-- ============================================================================
-- Migration: add_marketing_and_review_modules
--
-- Bổ sung các bảng mới cho các module:
--   - Review + ReviewStatus
--   - Notification
--   - Conversation + ConversationMessage
--   - RefundRequest + RefundStatus
--   - Coupon + CouponRedemption + DiscountType (mở rộng bảng coupons cũ)
--   - FaqCategory + FaqItem
--   - Article + ArticleStatus
--   - Tag + ServiceTag
--   - Favorite
--   - User: quan hệ ngược cho các bảng trên
--
-- Toàn bộ câu lệnh dùng IF NOT EXISTS / DO block để **idempotent**:
-- chạy lại nhiều lần không lỗi (phòng trường hợp bảng đã có sẵn một phần).
-- ============================================================================

-- ===== ENUMS =====
DO $$ BEGIN
  CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== REVIEWS =====
CREATE TABLE IF NOT EXISTS "reviews" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
  "adminReply" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "reviews_orderId_key" ON "reviews"("orderId");
CREATE INDEX IF NOT EXISTS "reviews_serviceId_status_idx" ON "reviews"("serviceId", "status");

DO $$ BEGIN
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_serviceId_fkey"
    FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== NOTIFICATIONS =====
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "href" TEXT,
  "payload" JSONB,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

DO $$ BEGIN
  ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== CONVERSATIONS =====
CREATE TABLE IF NOT EXISTS "conversations" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "adminId" TEXT,
  "subject" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "conversations_userId_lastMessageAt_idx"
  ON "conversations"("userId", "lastMessageAt");

DO $$ BEGIN
  ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "conversations" ADD CONSTRAINT "conversations_adminId_fkey"
    FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== CONVERSATION_MESSAGES =====
CREATE TABLE IF NOT EXISTS "conversation_messages" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "senderRole" "Role" NOT NULL,
  "content" TEXT NOT NULL,
  "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "conversation_messages_conversationId_createdAt_idx"
  ON "conversation_messages"("conversationId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== REFUND_REQUESTS =====
CREATE TABLE IF NOT EXISTS "refund_requests" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "description" TEXT,
  "evidence" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
  "amount" DOUBLE PRECISION NOT NULL,
  "resolution" TEXT,
  "processedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "refund_requests_orderId_key" ON "refund_requests"("orderId");
CREATE INDEX IF NOT EXISTS "refund_requests_status_createdAt_idx"
  ON "refund_requests"("status", "createdAt");

DO $$ BEGIN
  ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== COUPONS — mở rộng bảng cũ =====
-- Bảng coupons cũ (init) chỉ có: id, code, discount, isActive, expiresAt.
-- Schema mới thêm nhiều cột: dùng ADD COLUMN IF NOT EXISTS (PG 9.6+).
ALTER TABLE "coupons"
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "discountType" "DiscountType" NOT NULL DEFAULT 'PERCENT',
  ADD COLUMN IF NOT EXISTS "maxDiscount" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "minOrderValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "usageLimit" INTEGER,
  ADD COLUMN IF NOT EXISTS "usagePerUser" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "appliesToAll" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "serviceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "categoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "userRestrictions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "startsAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ===== COUPON_REDEMPTIONS =====
CREATE TABLE IF NOT EXISTS "coupon_redemptions" (
  "id" TEXT NOT NULL,
  "couponId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "discountAmount" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "coupon_redemptions_orderId_key" ON "coupon_redemptions"("orderId");
CREATE INDEX IF NOT EXISTS "coupon_redemptions_couponId_userId_idx"
  ON "coupon_redemptions"("couponId", "userId");

DO $$ BEGIN
  ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_couponId_fkey"
    FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== FAQ_CATEGORIES =====
CREATE TABLE IF NOT EXISTS "faq_categories" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "faq_categories_pkey" PRIMARY KEY ("id")
);

-- ===== FAQ_ITEMS =====
CREATE TABLE IF NOT EXISTS "faq_items" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "faq_items" ADD CONSTRAINT "faq_items_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "faq_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== ARTICLES =====
CREATE TABLE IF NOT EXISTS "articles" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "excerpt" TEXT,
  "content" TEXT NOT NULL,
  "coverImage" TEXT,
  "authorId" TEXT NOT NULL,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "articles_slug_key" ON "articles"("slug");
CREATE INDEX IF NOT EXISTS "articles_status_publishedAt_idx"
  ON "articles"("status", "publishedAt");

DO $$ BEGIN
  ALTER TABLE "articles" ADD CONSTRAINT "articles_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== TAGS =====
CREATE TABLE IF NOT EXISTS "tags" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tags_name_key" ON "tags"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "tags_slug_key" ON "tags"("slug");

-- ===== SERVICE_TAGS =====
CREATE TABLE IF NOT EXISTS "service_tags" (
  "serviceId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  CONSTRAINT "service_tags_pkey" PRIMARY KEY ("serviceId", "tagId")
);

DO $$ BEGIN
  ALTER TABLE "service_tags" ADD CONSTRAINT "service_tags_serviceId_fkey"
    FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "service_tags" ADD CONSTRAINT "service_tags_tagId_fkey"
    FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== FAVORITES =====
CREATE TABLE IF NOT EXISTS "favorites" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "favorites_userId_serviceId_key"
  ON "favorites"("userId", "serviceId");

DO $$ BEGIN
  ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "favorites" ADD CONSTRAINT "favorites_serviceId_fkey"
    FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
