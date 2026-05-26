import { PrismaClient } from "@prisma/client";

// Singleton Prisma client. Di development, Next.js melakukan hot-reload yang
// bisa membuat banyak koneksi baru. Kita cache instance di globalThis agar
// hanya ada satu PrismaClient.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
