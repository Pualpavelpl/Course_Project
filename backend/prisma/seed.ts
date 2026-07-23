import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  disconnectPrisma,
} from "../src/lib/prisma.js";
import { hashPassword } from "../src/modules/auth/password.js";
import { seedDemoData } from "./seed/run.js";

const seedEnvironmentSchema = z.object({
  DEMO_USER_PASSWORD: z
    .string()
    .min(8)
    .refine((password) => !bcrypt.truncates(password)),
});

function getSafeSeedError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Unknown seed error";
  }

  return error.message
    .replace(
      /postgres(?:ql)?:\/\/[^\s]+/giu,
      "[DATABASE_URL]",
    )
    .replace(/password=[^\s]+/giu, "password=[REDACTED]");
}

async function runSeed() {
  const { DEMO_USER_PASSWORD } = seedEnvironmentSchema.parse(
    process.env,
  );
  const passwordHash = await hashPassword(DEMO_USER_PASSWORD);

  return seedDemoData(passwordHash);
}

runSeed()
  .then((counts) => {
    process.stdout.write(
      `Demo data is ready: ${JSON.stringify(counts)}\n`,
    );

    return counts;
  })
  .catch((error: unknown) => {
    process.stderr.write(
      `Demo seed failed: ${getSafeSeedError(error)}\n`,
    );
    process.exitCode = 1;
  })
  .finally(disconnectPrisma);
