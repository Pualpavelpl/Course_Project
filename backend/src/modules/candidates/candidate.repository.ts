import {
  Prisma,
} from "../../generated/prisma/client.js";
import { getPrismaClient } from "../../lib/prisma.js";
import {
  requiredProfileAttributeNames,
  requiredProfileAttributes,
} from "../profiles/required-profile-attributes.js";

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
      async (transaction) => {
        await transaction.attribute.createMany({
          data: [...requiredProfileAttributes],
          skipDuplicates: true,
        });
        await transaction.attribute.updateMany({
          where: { name: { in: requiredProfileAttributeNames } },
          data: {
            type: "STRING",
            category: "PERSONAL_INFORMATION",
            isBuiltin: true,
          },
        });
        const requiredAttributes = await transaction.attribute.findMany({
          where: { name: { in: requiredProfileAttributeNames } },
          select: { id: true },
        });

        if (requiredAttributes.length !== requiredProfileAttributes.length) {
          throw new Error("Required Profile Attributes are unavailable");
        }

        return transaction.candidate.create({
          data: {
            email,
            passwordHash,
            profile: {
              create: {
                profileAttributes: {
                  createMany: {
                    data: requiredAttributes.map(({ id }) => ({
                      attributeId: id,
                    })),
                  },
                },
              },
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
        });
      },
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
