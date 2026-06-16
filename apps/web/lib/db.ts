import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { financeRadarPrisma?: PrismaClient };
const datasourceUrl = process.env.DATABASE_URL;
const isBuild = process.env.NEXT_PHASE === "phase-production-build" || process.env.npm_lifecycle_event === "build";

let prismaInstance: PrismaClient | null = null;
if (datasourceUrl || !isBuild) {
  prismaInstance = new PrismaClient({ datasourceUrl });
}

export const prisma: PrismaClient = prismaInstance ?? (globalForPrisma.financeRadarPrisma as PrismaClient);

if (process.env.NODE_ENV !== "production") globalForPrisma.financeRadarPrisma = prismaInstance as PrismaClient;