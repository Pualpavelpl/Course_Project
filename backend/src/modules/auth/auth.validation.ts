import bcrypt from "bcryptjs";
import { z } from "zod";
import { AUTH_ROLES } from "./auth.types.js";

const emptyParamsSchema = z.strictObject({});
const emptyQuerySchema = z.strictObject({});

export const accountEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email().max(255));

const passwordSchema = z
  .string()
  .min(1)
  .refine((password) => !bcrypt.truncates(password));

export const newAccountPasswordSchema = passwordSchema.min(8);

export const candidateRegistrationRequestSchema = z.strictObject({
  body: z.strictObject({
    email: accountEmailSchema,
    password: newAccountPasswordSchema,
  }),
  params: emptyParamsSchema,
  query: emptyQuerySchema,
});

export const loginRequestSchema = z.strictObject({
  body: z.strictObject({
    email: accountEmailSchema,
    password: passwordSchema,
  }),
  params: emptyParamsSchema,
  query: emptyQuerySchema,
});

export const sessionRequestSchema = z.strictObject({
  body: z.undefined().optional(),
  params: emptyParamsSchema,
  query: emptyQuerySchema,
});

export const authTokenPayloadSchema = z.strictObject({
  subject: z.uuid(),
  role: z.enum(AUTH_ROLES),
});

export type CandidateRegistrationRequest = z.infer<
  typeof candidateRegistrationRequestSchema
>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type AuthTokenPayload = z.infer<typeof authTokenPayloadSchema>;
