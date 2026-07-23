import { getPrismaClient } from "../../lib/prisma.js";

export async function verifyDatabaseConnection(): Promise<void> {
  await getPrismaClient().$queryRaw`SELECT 1`;
}
