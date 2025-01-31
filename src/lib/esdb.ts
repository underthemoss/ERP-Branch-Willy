// lib/prisma.ts
import { PrismaClient } from "../../prisma/generated/esdb";

const globalForPrisma = global as unknown as { esdb: PrismaClient };

export const esdb =
  globalForPrisma.esdb ||
  new PrismaClient({
    // log: ["query"], // Optional: Logs queries for debugging purposes
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.esdb = esdb;

process.on("SIGTERM", async () => {
  await esdb.$disconnect();
});
