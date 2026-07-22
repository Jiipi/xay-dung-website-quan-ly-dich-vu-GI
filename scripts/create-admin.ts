import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createAdminUser() {
  const email = "hungmegame.it@gmail.com";
  const rawPassword = "12345678";
  const name = "Admin Hùng";

  console.log(`⏳ Đang tạo/cập nhật tài khoản Admin: ${email}...`);

  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: passwordHash,
      role: "ADMIN",
      isActive: true,
      name,
    },
    create: {
      email,
      password: passwordHash,
      role: "ADMIN",
      isActive: true,
      name,
    },
  });

  console.log(`✅ Đã tạo/cập nhật tài khoản Admin thành công!`);
  console.log(`ID: ${user.id}`);
  console.log(`Email: ${user.email}`);
  console.log(`Role: ${user.role}`);
}

createAdminUser()
  .catch((err) => {
    console.error("❌ Lỗi khi tạo Admin:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
