import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  // AWS RDS는 SSL 필수. connectionString의 sslmode 제거 후 options에서 명시.
  const useSsl =
    /sslmode=require/i.test(connectionString) || connectionString.includes("rds.amazonaws.com");
  const cleanedUrl = useSsl
    ? connectionString.replace(/([?&])sslmode=[^&]+&?/g, "$1").replace(/[?&]$/, "")
    : connectionString;
  const adapter = new PrismaPg({
    connectionString: cleanedUrl,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient = global.__prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
