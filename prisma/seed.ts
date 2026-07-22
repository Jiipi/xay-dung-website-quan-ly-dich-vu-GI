import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";
import crypto from "crypto";

// AES-256-GCM encryption (same logic as src/lib/encryption.ts)
function getSecretKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error(
      "ENCRYPTION_KEY chưa cấu hình (>= 32 ký tự) — không thể seed dữ liệu credential đã mã hóa."
    );
  }
  return Buffer.from(key.slice(0, 32), "utf8");
}
function encryptPassword(text: string): string {
  const iv = crypto.randomBytes(12);
  const key = getSecretKey();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Bắt đầu dọn dẹp database cũ...");
  
  // Xóa dữ liệu cũ theo thứ tự quan hệ
  await prisma.adminAuditLog.deleteMany();
  await prisma.orderCredential.deleteMany();
  await prisma.orderMessage.deleteMany();
  await prisma.orderStatusLog.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.paymentIntent.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.servicePriceOption.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.faqCategory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.pagesContent.deleteMany();

  console.log("🌱 Tạo dữ liệu Người dùng...");
  
  // Mã hóa mật khẩu mẫu
  const userPasswordHash = await bcrypt.hash("user123", 10);
  const adminPasswordHash = await bcrypt.hash("admin123", 10);

  // Tạo User mẫu
  await prisma.user.create({
    data: {
      id: "user-1",
      name: "Nguyễn Văn An",
      email: "an.nguyen@gmail.com",
      password: userPasswordHash,
      role: "CUSTOMER",
    },
  });

  await prisma.user.create({
    data: {
      id: "user-2",
      name: "Trần Thị Bình",
      email: "binh.tran@gmail.com",
      password: userPasswordHash,
      role: "CUSTOMER",
    },
  });

  // Tạo Admin mẫu
  const hungAdminPassHash = await bcrypt.hash("12345678", 10);
  await prisma.user.create({
    data: {
      id: "admin-hung",
      name: "Admin Hùng",
      email: "hungmegame.it@gmail.com",
      password: hungAdminPassHash,
      role: "ADMIN",
    },
  });

  await prisma.user.create({
    data: {
      id: "admin-1",
      name: "Admin GenshinFlow",
      email: "admin@genshinflow.vn",
      password: adminPasswordHash,
      role: "ADMIN",
    },
  });

  // Tạo Booster mẫu
  const boosterPasswordHash = await bcrypt.hash("booster123", 10);
  await prisma.user.create({
    data: {
      id: "booster-1",
      name: "Booster Minh Hoàng",
      email: "booster@genshinflow.vn",
      password: boosterPasswordHash,
      role: "BOOSTER",
    },
  });

  console.log("🌱 Tạo Danh mục dịch vụ...");

  // Tạo các danh mục
  const categories = [
    { id: "endgame", name: "Endgame", icon: "⚔️" },
    { id: "gacha", name: "Gacha", icon: "🎲" },
    { id: "farm", name: "Farm", icon: "🌾" },
    { id: "map", name: "Map", icon: "🗺️" },
    { id: "event", name: "Sự kiện", icon: "🎉" },
    { id: "custom", name: "Tùy chỉnh", icon: "✨" },
  ];

  for (const cat of categories) {
    await prisma.serviceCategory.create({ data: cat });
  }

  console.log("🌱 Tạo Dịch vụ & Gói cước mẫu...");

  // Dịch vụ 1
  await prisma.service.create({
    data: {
      id: "svc-1",
      name: "La Hoàn Thâm Cảnh 36★",
      description: "Clear toàn bộ La Hoàn Thâm Cảnh 36 sao. Đảm bảo full star với đội hình tối ưu.",
      categoryId: "endgame",
      difficulty: "Rất khó",
      estimatedTime: "2-4 giờ",
      isPopular: true,
      imageUrl: "/services/spiral_abyss.png",
      priceOptions: {
        create: [
          { id: "opt-1a", name: "Full 36★", price: 150000, originalPrice: 200000 },
          { id: "opt-1b", name: "Từ 33★ lên 36★", price: 80000 },
        ],
      },
    },
  });

  // Dịch vụ 2
  await prisma.service.create({
    data: {
      id: "svc-2",
      name: "Nhà Hát Giả Tưởng",
      description: "Hoàn thành Nhà Hát Giả Tưởng ở độ khó Siêu Khó, lấy hết reward.",
      categoryId: "endgame",
      difficulty: "Khó",
      estimatedTime: "1-3 giờ",
      imageUrl: "/services/imaginarium_theater.png",
      priceOptions: {
        create: [
          { id: "opt-2a", name: "Siêu Khó", price: 120000 },
          { id: "opt-2b", name: "Khó", price: 70000 },
        ],
      },
    },
  });

  // Dịch vụ mới 1: Đánh hộ ảo cảnh genshin 1 tới 6 (Imaginarium Theater Stages 1-6)
  await prisma.service.create({
    data: {
      id: "svc-3",
      name: "Đánh Hộ Ảo Cảnh (Màn 1 -> 6)",
      description: "Vượt ải Ảo Cảnh Kịch Kịch (Imaginarium Theater) từ màn 1 đến màn 6 nhanh chóng, nhận trọn vẹn phần thưởng Nguyên Thạch.",
      categoryId: "endgame",
      difficulty: "Trung bình",
      estimatedTime: "1 giờ",
      imageUrl: "/services/ao_canh_hiem_ac.png",
      priceOptions: {
        create: [
          { id: "opt-3a", name: "Trọn gói màn 1 -> 6", price: 90000 },
        ],
      },
    },
  });

  // Dịch vụ mới 2: Roll hộ char và vũ khí
  await prisma.service.create({
    data: {
      id: "svc-4",
      name: "Roll Hộ Nhân Vật & Vũ Khí",
      description: "Dịch vụ ước nguyện (cầu nguyện) nhân vật và vũ khí giới hạn. Tư vấn tối ưu tài nguyên gacha.",
      categoryId: "gacha",
      difficulty: "Dễ",
      estimatedTime: "15-30 phút",
      isPopular: true,
      imageUrl: "/services/gacha_roll.png",
      priceOptions: {
        create: [
          { id: "opt-4a", name: "Roll Nhân Vật", price: 50000 },
          { id: "opt-4b", name: "Roll Vũ Khí", price: 40000 },
        ],
      },
    },
  });

  // Dịch vụ 3 (được đánh số cũ)
  await prisma.service.create({
    data: {
      id: "svc-5",
      name: "Farm Thánh Di Vật (1 tuần)",
      description: "Farm thánh di vật theo set được yêu cầu trong 7 ngày. Tối ưu resin hàng ngày.",
      categoryId: "farm",
      difficulty: "Trung bình",
      estimatedTime: "7-14 ngày",
      imageUrl: "/services/artifact_farming.png",
      priceOptions: {
        create: [
          { id: "opt-5a", name: "1 tuần", price: 80000 },
          { id: "opt-5b", name: "2 tuần", price: 140000, originalPrice: 160000 },
        ],
      },
    },
  });

  // Dịch vụ mới 3: Review acc nên lấy char gì vũ khí gì tiếp theo
  await prisma.service.create({
    data: {
      id: "svc-6",
      name: "Review Account & Định Hướng Gacha",
      description: "Đánh giá chi tiết tài khoản (nhân vật, thánh di vật, vũ khí). Khuyên dùng nhân vật/vũ khí nên lấy tiếp theo phù hợp meta.",
      categoryId: "gacha",
      difficulty: "Dễ",
      estimatedTime: "30-60 phút",
      imageUrl: "/services/account_review.png",
      priceOptions: {
        create: [
          { id: "opt-6a", name: "Review Chi Tiết (Có file báo cáo)", price: 30000 },
        ],
      },
    },
  });

  // Dịch vụ 4 (được đánh số cũ)
  await prisma.service.create({
    data: {
      id: "svc-7",
      name: "Mở Map & Thần Đồng",
      description: "Mở toàn bộ map khu vực được chọn, thu thập Thần Đồng, mở waypoint.",
      categoryId: "map",
      difficulty: "Trung bình",
      estimatedTime: "4-8 giờ",
      isPopular: true,
      imageUrl: "/services/map_oculus.png",
      priceOptions: {
        create: [
          { id: "opt-7a", name: "1 khu vực", price: 60000 },
          { id: "opt-7b", name: "Full map", price: 250000, originalPrice: 300000 },
        ],
      },
    },
  });

  // Dịch vụ mới 4: Cày sự kiện
  await prisma.service.create({
    data: {
      id: "svc-8",
      name: "Cày Sự Kiện (Event Farm)",
      description: "Dọn dẹp và hoàn thành nhanh chóng các sự kiện đang mở trong game để lấy trọn vẹn Nguyên Thạch và vật phẩm giới hạn.",
      categoryId: "event",
      difficulty: "Dễ",
      estimatedTime: "1-3 giờ",
      imageUrl: "/services/event_farming.png",
      priceOptions: {
        create: [
          { id: "opt-8a", name: "Sự Kiện Lớn (Major Event)", price: 80000 },
          { id: "opt-8b", name: "Sự Kiện Nhỏ (Minor Event)", price: 30000 },
        ],
      },
    },
  });

  console.log("🌱 Tạo các giao dịch ví mẫu (Ledger) cho user-1...");

  // Tạo các giao dịch ví mẫu để sinh số dư 520,000đ cho user-1
  await prisma.walletTransaction.createMany({
    data: [
      {
        id: "tx-1",
        userId: "user-1",
        type: "deposit",
        amount: 500000,
        balance: 500000,
        description: "Nạp tiền qua QR",
        status: "success",
        createdAt: new Date("2026-06-15T10:00:00Z"),
      },
      {
        id: "tx-2",
        userId: "user-1",
        type: "bonus",
        amount: 50000,
        balance: 550000,
        description: "Thưởng nạp lần đầu 10%",
        status: "success",
        createdAt: new Date("2026-06-15T10:00:01Z"),
      },
      {
        id: "tx-3",
        userId: "user-1",
        type: "hold",
        amount: -80000,
        balance: 470000,
        description: "Tạm giữ - Farm Thánh Di Vật",
        status: "success",
        createdAt: new Date("2026-06-20T08:00:00Z"),
      },
      {
        id: "tx-4",
        userId: "user-1",
        type: "charge",
        amount: -80000,
        balance: 470000,
        description: "Thanh toán - Farm Thánh Di Vật",
        status: "success",
        createdAt: new Date("2026-06-27T18:00:00Z"),
      },
      {
        id: "tx-5",
        userId: "user-1",
        type: "deposit",
        amount: 200000,
        balance: 670000,
        description: "Nạp tiền qua QR",
        status: "success",
        createdAt: new Date("2026-07-01T09:00:00Z"),
      },
      {
        id: "tx-6",
        userId: "user-1",
        type: "hold",
        amount: -150000,
        balance: 520000,
        description: "Tạm giữ - La Hoàn 36★",
        status: "success",
        createdAt: new Date("2026-07-01T10:00:00Z"),
      },
    ],
  });

  console.log("🌱 Tạo Đơn hàng mẫu...");

  // Đơn hàng mẫu 1 (Đang xử lý)
  await prisma.order.create({
    data: {
      id: "ord-1",
      orderNumber: "GF-2026-0001",
      userId: "user-1",
      boosterId: "booster-1",
      boosterCommission: 45000,
      serviceId: "svc-1",
      priceOptionId: "opt-1a",
      amount: 150000,
      status: "in_progress",
      uid: "812345678",
      server: "Asia",
      note: "Ưu tiên dùng Raiden National và Neuvillette team",
      createdAt: new Date("2026-07-01T10:00:00Z"),
      statusLogs: {
        create: [
          { status: "pending_payment", createdBy: "system", createdAt: new Date("2026-07-01T10:00:00Z") },
          { status: "waiting_admin_accept", createdBy: "system", createdAt: new Date("2026-07-01T10:01:00Z") },
          { status: "in_progress", note: "Đã nhận đơn, bắt đầu xử lý", createdBy: "Admin GenshinFlow", createdAt: new Date("2026-07-01T10:30:00Z") },
        ],
      },
      messages: {
        create: [
          { message: "Em đã nhận đơn, dự kiến hoàn thành trong 3 giờ nhé!", senderRole: "ADMIN", senderName: "Admin", createdAt: new Date("2026-07-01T10:31:00Z") },
          { message: "Dạ vâng, cảm ơn admin!", senderRole: "CUSTOMER", senderName: "Nguyễn Văn An", createdAt: new Date("2026-07-01T10:35:00Z") },
        ],
      },
      credentials: {
        create: {
          encryptedPassword: encryptPassword("GamePass@Raiden2026"),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
        },
      },
    },
  });

  // Đơn hàng mẫu 2 (Đã hoàn tất)
  await prisma.order.create({
    data: {
      id: "ord-2",
      orderNumber: "GF-2026-0002",
      userId: "user-1",
      serviceId: "svc-5",
      priceOptionId: "opt-5a",
      amount: 80000,
      status: "completed",
      uid: "812345678",
      server: "Asia",
      createdAt: new Date("2026-06-20T08:00:00Z"),
      statusLogs: {
        create: [
          { status: "pending_payment", createdBy: "system", createdAt: new Date("2026-06-20T08:00:00Z") },
          { status: "in_progress", createdBy: "Admin GenshinFlow", createdAt: new Date("2026-06-20T09:00:00Z") },
          { status: "completed", note: "Hoàn thành farm 7 ngày", createdBy: "Admin GenshinFlow", createdAt: new Date("2026-06-27T18:00:00Z") },
        ],
      },
    },
  });

  console.log("🌱 Tạo Đánh giá mẫu (Approved)...");
  await prisma.review.create({
    data: {
      id: "rev-1",
      userId: "user-1",
      orderId: "ord-2",
      serviceId: "svc-5",
      rating: 5,
      content: "Lần đầu dùng dịch vụ, rất an tâm vì được mã hóa mật khẩu. Admin làm việc nhiệt tình, farm đủ 7 ngày đúng hạn!",
      status: "APPROVED",
      adminReply: "Cảm ơn bạn An đã tin tưởng GenshinFlow! Chúc bạn gacha may mắn nhé ❤️",
      createdAt: new Date("2026-06-28T09:00:00Z"),
    },
  });

  console.log("🌱 Tạo Coupon mẫu...");
  await prisma.coupon.createMany({
    data: [
      {
        id: "coup-1",
        code: "GFWELCOME10",
        description: "Giảm 10% cho đơn hàng đầu tiên",
        discountType: "PERCENT",
        discount: 10,
        maxDiscount: 50000,
        minOrderValue: 50000,
        isActive: true,
        expiresAt: new Date("2026-12-31T23:59:59Z"),
      },
      {
        id: "coup-2",
        code: "GFVIP20K",
        description: "Giảm trực tiếp 20.000đ cho đơn từ 100.000đ",
        discountType: "FIXED",
        discount: 20000,
        minOrderValue: 100000,
        isActive: true,
        expiresAt: new Date("2026-12-31T23:59:59Z"),
      },
    ],
  });

  console.log("🌱 Tạo FAQ mẫu...");
  await prisma.faqCategory.create({
    data: {
      id: "faq-cat-general",
      name: "Câu hỏi thường gặp",
      order: 1,
      items: {
        create: [
          {
            question: "GenshinFlow hoạt động như thế nào?",
            answer: "Bạn đăng ký tài khoản, nạp tiền vào ví, chọn dịch vụ và tạo đơn. Admin/Booster sẽ nhận đơn và thực hiện dịch vụ trên tài khoản game của bạn. Bạn có thể theo dõi tiến độ realtime.",
            order: 1,
          },
          {
            question: "Tài khoản game của tôi có an toàn không?",
            answer: "Chúng tôi mã hóa thông tin đăng nhập bằng AES-256-GCM. Mật khẩu chỉ được hiển thị cho admin/booster khi cần thiết và mọi lần xem đều được ghi log. Sau khi đơn hoàn tất, dữ liệu mật khẩu sẽ được xóa tự động.",
            order: 2,
          },
          {
            question: "Tôi nạp tiền bằng cách nào?",
            answer: "Chúng tôi hỗ trợ nạp tiền qua QR Code ngân hàng (PayOS/VietQR). Bạn chỉ cần quét mã QR hoặc chuyển khoản đúng nội dung. Hệ thống sẽ tự động xác nhận trong vài giây.",
            order: 3,
          },
          {
            question: "Nếu không hài lòng, tôi có được hoàn tiền không?",
            answer: "Có. Nếu dịch vụ không được hoàn thành đúng cam kết, bạn sẽ được hoàn tiền 100% vào ví sổ cái nội bộ thông qua quy trình Khiếu nại.",
            order: 4,
          },
        ],
      },
    },
  });

  console.log("🌱 Nạp nội dung các trang tĩnh...");
  await prisma.pagesContent.createMany({
    data: [
      {
        pageName: "terms",
        content: `# Điều khoản dịch vụ\n\nCập nhật lần cuối: 01/07/2026\n\n## 1. Giới thiệu\nChào mừng bạn đến với GenshinFlow...`,
      },
      {
        pageName: "privacy",
        content: `# Chính sách bảo mật\n\nCập nhật lần cuối: 01/07/2026\n\n## 1. Dữ liệu chúng tôi thu thập...`,
      },
      {
        pageName: "refund",
        content: `# Chính sách hoàn tiền\n\nCập nhật lần cuối: 01/07/2026\n\n## 1. Nguyên tắc chung...`,
      },
    ],
  });

  console.log("🎉 Hoàn tất Seeding database thành công!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
