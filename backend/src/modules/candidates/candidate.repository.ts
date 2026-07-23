import {
  Prisma,
} from "../../generated/prisma/client.js";
import { getPrismaClient } from "../../lib/prisma.js";

const candidateCredentialsSelect = {
  id: true,
  email: true,
  passwordHash: true,
  isBlocked: true,
} satisfies Prisma.CandidateSelect;

const candidateSessionSelect = {
  id: true,
  email: true,
  isBlocked: true,
} satisfies Prisma.CandidateSelect;

type CandidateCredentials = Prisma.CandidateGetPayload<{
  select: typeof candidateCredentialsSelect;
}>;

type CandidateSession = Prisma.CandidateGetPayload<{
  select: typeof candidateSessionSelect;
}>;

export async function findCandidateCredentialsByEmail(
  email: string,
): Promise<CandidateCredentials | null> {
  return getPrismaClient().candidate.findUnique({
    where: { email },
    select: candidateCredentialsSelect,
  });
}

export async function findCandidateSessionById(
  id: string,
): Promise<CandidateSession | null> {
  return getPrismaClient().candidate.findUnique({
    where: { id },
    select: candidateSessionSelect,
  });
}

export async function candidateEmailExists(email: string): Promise<boolean> {
  const candidate = await getPrismaClient().candidate.findUnique({
    where: { email },
    select: { id: true },
  });

  return candidate !== null;
}

export async function createCandidateWithProfile(
  email: string,
  passwordHash: string,
) {
  try {
    const candidate = await getPrismaClient().$transaction(
      async (transaction) =>
        transaction.candidate.create({
          data: {
            email,
            passwordHash,
            profile: {
              create: {},
            },
          },
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                id: true,
              },
            },
          },
        }),
    );

    return {
      status: "created" as const,
      candidate,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        status: "email_conflict" as const,
      };
    }

    throw error;
  }
}
