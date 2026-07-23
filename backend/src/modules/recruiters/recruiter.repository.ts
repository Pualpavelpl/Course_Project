import { Prisma } from "../../generated/prisma/client.js";
import { getPrismaClient } from "../../lib/prisma.js";

const recruiterCredentialsSelect = {
  id: true,
  email: true,
  passwordHash: true,
  isBlocked: true,
  admin: {
    select: {
      recruiterId: true,
    },
  },
} satisfies Prisma.RecruiterSelect;

const recruiterSessionSelect = {
  id: true,
  email: true,
  isBlocked: true,
  admin: {
    select: {
      recruiterId: true,
    },
  },
} satisfies Prisma.RecruiterSelect;

type RecruiterCredentials = Prisma.RecruiterGetPayload<{
  select: typeof recruiterCredentialsSelect;
}>;

type RecruiterSession = Prisma.RecruiterGetPayload<{
  select: typeof recruiterSessionSelect;
}>;

export async function findRecruiterCredentialsByEmail(
  email: string,
): Promise<(Omit<RecruiterCredentials, "admin"> & {
  effectiveRole: "RECRUITER" | "ADMIN";
}) | null> {
  const recruiter = await getPrismaClient().recruiter.findUnique({
    where: { email },
    select: recruiterCredentialsSelect,
  });

  return recruiter
    ? {
        id: recruiter.id,
        email: recruiter.email,
        passwordHash: recruiter.passwordHash,
        isBlocked: recruiter.isBlocked,
        effectiveRole: recruiter.admin ? "ADMIN" : "RECRUITER",
      }
    : null;
}

export async function findRecruiterSessionById(
  id: string,
): Promise<(Omit<RecruiterSession, "admin"> & {
  effectiveRole: "RECRUITER" | "ADMIN";
}) | null> {
  const recruiter = await getPrismaClient().recruiter.findUnique({
    where: { id },
    select: recruiterSessionSelect,
  });

  return recruiter
    ? {
        id: recruiter.id,
        email: recruiter.email,
        isBlocked: recruiter.isBlocked,
        effectiveRole: recruiter.admin ? "ADMIN" : "RECRUITER",
      }
    : null;
}

export async function recruiterEmailExists(email: string): Promise<boolean> {
  const recruiter = await getPrismaClient().recruiter.findUnique({
    where: { email },
    select: { id: true },
  });

  return recruiter !== null;
}
