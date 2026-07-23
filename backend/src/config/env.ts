import "dotenv/config";
import { z } from "zod";

const JWT_SECRET_PLACEHOLDER =
  "REPLACE_WITH_RANDOM_SECRET_AT_LEAST_32_CHARACTERS";

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(5000),
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
  }),
  FRONTEND_URL: z.url({
    protocol: /^https?$/,
  }),
  JWT_SECRET: z
    .string()
    .min(32)
    .refine((value) => value !== JWT_SECRET_PLACEHOLDER),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/)
    .default("1h"),
});

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(
  environment: NodeJS.ProcessEnv,
): Environment {
  const result = environmentSchema.safeParse(environment);

  if (!result.success) {
    const invalidVariables = [
      ...new Set(
        result.error.issues.map((issue) => String(issue.path[0] ?? "unknown")),
      ),
    ].join(", ");

    throw new Error(`Invalid environment variables: ${invalidVariables}`);
  }

  return result.data;
}

export const env = parseEnvironment(process.env);
