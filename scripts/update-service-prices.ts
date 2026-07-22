import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function updateServicePrices() {
  console.log("⏳ Bắt đầu cập nhật giá dịch vụ mới theo yêu cầu...");

  // 1. Roll hộ nhân vật & vũ khí -> 0đ
  const svcRoll = await prisma.service.findFirst({
    where: { name: { contains: "Roll", mode: "insensitive" } },
    include: { priceOptions: true },
  });
  if (svcRoll) {
    for (const opt of svcRoll.priceOptions) {
      await prisma.servicePriceOption.update({
        where: { id: opt.id },
        data: { price: 0, originalPrice: 0 },
      });
    }
    console.log("✅ Đã cập nhật Roll hộ -> 0đ");
  }

  // 2. La Hoàn Thâm Cảnh -> 36 sao 20k, mỗi tầng lẻ 10k (3 tầng)
  const svcAbyss = await prisma.service.findFirst({
    where: { name: { contains: "La Hoàn", mode: "insensitive" } },
    include: { priceOptions: true },
  });
  if (svcAbyss) {
    // Cập nhật option trọn gói 36 sao
    if (svcAbyss.priceOptions.length > 0) {
      await prisma.servicePriceOption.update({
        where: { id: svcAbyss.priceOptions[0].id },
        data: { name: "Trọn gói La Hoàn 36★", price: 20000, originalPrice: 0 },
      });
    }
    // Xóa các option thừa không dính foreign key nếu có
    for (let i = 1; i < svcAbyss.priceOptions.length; i++) {
      try {
        await prisma.servicePriceOption.delete({ where: { id: svcAbyss.priceOptions[i].id } });
      } catch {
        await prisma.servicePriceOption.update({
          where: { id: svcAbyss.priceOptions[i].id },
          data: { name: "Đi lẻ Tầng 10", price: 10000 },
        });
      }
    }
    // Đảm bảo đủ các tầng đi lẻ
    const existingNames = (await prisma.servicePriceOption.findMany({ where: { serviceId: svcAbyss.id } })).map(o => o.name);
    const newOptions = [
      { name: "Đi lẻ Tầng 10", price: 10000 },
      { name: "Đi lẻ Tầng 11", price: 10000 },
      { name: "Đi lẻ Tầng 12", price: 10000 },
    ];
    for (const opt of newOptions) {
      if (!existingNames.includes(opt.name)) {
        await prisma.servicePriceOption.create({
          data: { serviceId: svcAbyss.id, name: opt.name, price: opt.price },
        });
      }
    }
    console.log("✅ Đã cập nhật La Hoàn 36 sao (20k) và đi lẻ các tầng (10k/tầng)");
  }

  // 3. Ảo cảnh (Imaginarium Theater / Ảo cảnh kịch kịch) -> 50k / 1 level
  const svcAoCanh = await prisma.service.findFirst({
    where: { name: { contains: "Ảo Cảnh", mode: "insensitive" } },
    include: { priceOptions: true },
  });
  if (svcAoCanh) {
    if (svcAoCanh.priceOptions.length > 0) {
      await prisma.servicePriceOption.update({
        where: { id: svcAoCanh.priceOptions[0].id },
        data: { name: "Ảo Cảnh (50k / 1 level)", price: 50000 },
      });
    } else {
      await prisma.servicePriceOption.create({
        data: { serviceId: svcAoCanh.id, name: "Ảo Cảnh (50k / 1 level)", price: 50000 },
      });
    }
    console.log("✅ Đã cập nhật Ảo Cảnh -> 50k / 1 level");
  }

  // 4. Farm thánh di vật -> 1 ngày đến 7 ngày (10k/ngày) + farm tới khi ra món cần (15k)
  const svcArtifact = await prisma.service.findFirst({
    where: { name: { contains: "Thánh Di Vật", mode: "insensitive" } },
    include: { priceOptions: true },
  });
  if (svcArtifact) {
    // Cập nhật option đầu tiên nếu có
    if (svcArtifact.priceOptions.length > 0) {
      await prisma.servicePriceOption.update({
        where: { id: svcArtifact.priceOptions[0].id },
        data: { name: "Farm 1 ngày", price: 10000, originalPrice: 0 },
      });
    }
    const targetOptions = [
      { name: "Farm 2 ngày", price: 20000 },
      { name: "Farm 3 ngày", price: 30000 },
      { name: "Farm 4 ngày", price: 40000 },
      { name: "Farm 5 ngày", price: 50000 },
      { name: "Farm 6 ngày", price: 60000 },
      { name: "Farm 7 ngày (1 tuần)", price: 70000 },
      { name: "Farm TDV tới khi ra món cần", price: 15000 },
    ];
    const existingOpts = await prisma.servicePriceOption.findMany({ where: { serviceId: svcArtifact.id } });
    const existingNames = existingOpts.map(o => o.name);

    for (const opt of targetOptions) {
      if (!existingNames.includes(opt.name)) {
        await prisma.servicePriceOption.create({
          data: { serviceId: svcArtifact.id, name: opt.name, price: opt.price },
        });
      }
    }
    console.log("✅ Đã cập nhật Farm Thánh Di Vật (1k/10k ngày + option ra món cần 15k)");
  }

  // 5. Nhà hát giả tưởng -> 50k
  const svcNhaHat = await prisma.service.findFirst({
    where: { name: { contains: "Nhà Hát", mode: "insensitive" } },
    include: { priceOptions: true },
  });
  if (svcNhaHat) {
    if (svcNhaHat.priceOptions.length > 0) {
      await prisma.servicePriceOption.update({
        where: { id: svcNhaHat.priceOptions[0].id },
        data: { name: "Trọn gói Nhà Hát Giả Tưởng", price: 50000 },
      });
    } else {
      await prisma.servicePriceOption.create({
        data: { serviceId: svcNhaHat.id, name: "Trọn gói Nhà Hát Giả Tưởng", price: 50000 },
      });
    }
    console.log("✅ Đã cập nhật Nhà Hát Giả Tưởng -> 50k");
  }

  // 6. Review account -> 5k
  const svcReview = await prisma.service.findFirst({
    where: { name: { contains: "Review", mode: "insensitive" } },
    include: { priceOptions: true },
  });
  if (svcReview) {
    if (svcReview.priceOptions.length > 0) {
      await prisma.servicePriceOption.update({
        where: { id: svcReview.priceOptions[0].id },
        data: { name: "Review Account Chi Tiết", price: 5000 },
      });
    } else {
      await prisma.servicePriceOption.create({
        data: { serviceId: svcReview.id, name: "Review Account Chi Tiết", price: 5000 },
      });
    }
    console.log("✅ Đã cập nhật Review Account -> 5k");
  }

  console.log("🎉 Hoàn tất cập nhật tất cả bảng giá dịch vụ!");
}

updateServicePrices()
  .catch((err) => {
    console.error("❌ Lỗi khi cập nhật giá dịch vụ:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
