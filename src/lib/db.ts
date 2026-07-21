import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function getDbInstance() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/postgres";

  const isCloudDb =
    connectionString.includes("supabase.co") ||
    connectionString.includes("neon.tech") ||
    connectionString.includes("pooler") ||
    connectionString.includes("sslmode=");

  const pool = new Pool({
    connectionString,
    max: process.env.NODE_ENV === "production" ? 10 : 5,
    ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
  });

  pool.on("error", (err) => {
    console.error("[pg-pool] Suppressed idle client error:", err.message);
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma || getDbInstance();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
export default db;
