import {
  Prisma,
  type AttributeCategory,
} from "../../generated/prisma/client.js";
import { getPrismaClient } from "../../lib/prisma.js";
import type { NormalizedAttributeValue } from "../attributes/attribute-value.js";

const profileAttributeSelect = {
  id: true,
  value: true,
  optionId: true,
  createdAt: true,
  updatedAt: true,
  option: {
    select: {
      id: true,
      value: true,
    },
  },
  attribute: {
    select: {
      id: true,
      name: true,
      description: true,
      type: true,
      category: true,
      isBuiltin: true,
      options: {
        select: {
          id: true,
          value: true,
          sortOrder: true,
        },
        orderBy: [{ sortOrder: "asc" as const }, { id: "asc" as const }],
      },
    },
  },
} satisfies Prisma.ProfileAttributeSelect;

export interface ProfileAttributeWrite
  extends NormalizedAttributeValue {
  attributeId: string;
}

interface AvailableAttributesInput {
  candidateId: string;
  skip: number;
  take: number;
  search?: string | undefined;
  category?: AttributeCategory | undefined;
}

function buildAvailableAttributeWhere(input: AvailableAttributesInput) {
  return {
    isBuiltin: false,
    profileAttributes: {
      none: {
        profile: { candidateId: input.candidateId },
      },
    },
    ...(input.search
      ? {
          name: {
            startsWith: input.search,
            mode: "insensitive" as const,
          },
        }
      : {}),
    ...(input.category ? { category: input.category } : {}),
  } satisfies Prisma.AttributeWhereInput;
}

export async function findProfileByCandidateId(candidateId: string) {
  return getPrismaClient().profile.findUnique({
    where: { candidateId },
    select: {
      id: true,
      version: true,
      createdAt: true,
      updatedAt: true,
      profileAttributes: {
        select: profileAttributeSelect,
        orderBy: [
          { attribute: { name: "asc" as const } },
          { id: "asc" as const },
        ],
      },
    },
  });
}

export async function findProfileAttribute(
  candidateId: string,
  attributeId: string,
) {
  return getPrismaClient().profileAttribute.findFirst({
    where: {
      attributeId,
      profile: { candidateId },
    },
    select: profileAttributeSelect,
  });
}

export async function findAttributeDefinitions(attributeIds: string[]) {
  return getPrismaClient().attribute.findMany({
    where: { id: { in: attributeIds } },
    select: {
      id: true,
      type: true,
      isBuiltin: true,
      options: {
        select: { id: true },
      },
    },
  });
}

export async function findAvailableProfileAttributes(
  input: AvailableAttributesInput,
) {
  const prisma = getPrismaClient();
  const where = buildAvailableAttributeWhere(input);
  const [items, total] = await prisma.$transaction([
    prisma.attribute.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        category: true,
        options: {
          select: {
            id: true,
            value: true,
            sortOrder: true,
          },
          orderBy: [
            { sortOrder: "asc" as const },
            { id: "asc" as const },
          ],
        },
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      skip: input.skip,
      take: input.take,
    }),
    prisma.attribute.count({ where }),
  ]);

  return { items, total };
}

async function updateProfileVersion(
  transaction: Prisma.TransactionClient,
  candidateId: string,
  version: number,
) {
  const result = await transaction.profile.updateMany({
    where: { candidateId, version },
    data: { version: { increment: 1 } },
  });

  if (result.count > 0) {
    return { status: "updated" as const };
  }

  const profile = await transaction.profile.findUnique({
    where: { candidateId },
    select: { id: true },
  });

  return {
    status: profile
      ? ("version_conflict" as const)
      : ("not_found" as const),
  };
}

async function replaceProfileAttributeRows(
  transaction: Prisma.TransactionClient,
  profileId: string,
  attributes: ProfileAttributeWrite[],
): Promise<void> {
  const attributeIds = attributes.map(({ attributeId }) => attributeId);

  await transaction.profileAttribute.deleteMany({
    where: {
      profileId,
      attributeId: { in: attributeIds },
    },
  });
  await transaction.profileAttribute.createMany({
    data: attributes.map(({ attributeId, optionId, value }) => ({
      profileId,
      attributeId,
      optionId,
      value,
    })),
  });
}

export async function replaceProfileAttributes(
  candidateId: string,
  version: number,
  attributes: ProfileAttributeWrite[],
) {
  return getPrismaClient().$transaction(async (transaction) => {
    const versionResult = await updateProfileVersion(
      transaction,
      candidateId,
      version,
    );

    if (versionResult.status !== "updated") {
      return versionResult;
    }

    const profile = await transaction.profile.findUniqueOrThrow({
      where: { candidateId },
      select: { id: true },
    });

    await replaceProfileAttributeRows(
      transaction,
      profile.id,
      attributes,
    );

    const updatedProfile = await transaction.profile.findUniqueOrThrow({
      where: { candidateId },
      select: {
        id: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        profileAttributes: {
          select: profileAttributeSelect,
          orderBy: [
            { attribute: { name: "asc" as const } },
            { id: "asc" as const },
          ],
        },
      },
    });

    return { status: "updated" as const, profile: updatedProfile };
  });
}

export async function createProfileAttribute(
  candidateId: string,
  version: number,
  attribute: ProfileAttributeWrite,
) {
  try {
    return await getPrismaClient().$transaction(async (transaction) => {
      const versionResult = await updateProfileVersion(
        transaction,
        candidateId,
        version,
      );

      if (versionResult.status !== "updated") {
        return versionResult;
      }

      const profile = await transaction.profile.findUniqueOrThrow({
        where: { candidateId },
        select: { id: true },
      });
      await transaction.profileAttribute.create({
        data: {
          profileId: profile.id,
          ...attribute,
        },
      });

      const updatedProfile =
        await transaction.profile.findUniqueOrThrow({
          where: { candidateId },
          select: {
            id: true,
            version: true,
            createdAt: true,
            updatedAt: true,
            profileAttributes: {
              select: profileAttributeSelect,
              orderBy: [
                { attribute: { name: "asc" as const } },
                { id: "asc" as const },
              ],
            },
          },
        });

      return { status: "created" as const, profile: updatedProfile };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { status: "duplicate" as const };
    }

    throw error;
  }
}

export async function deleteProfileAttribute(
  candidateId: string,
  version: number,
  attributeId: string,
) {
  try {
    return await getPrismaClient().$transaction(async (transaction) => {
      const versionResult = await updateProfileVersion(
        transaction,
        candidateId,
        version,
      );

      if (versionResult.status !== "updated") {
        return versionResult;
      }

      const profile = await transaction.profile.findUniqueOrThrow({
        where: { candidateId },
        select: { id: true },
      });

      await transaction.profileAttribute.delete({
        where: {
          profileId_attributeId: {
            profileId: profile.id,
            attributeId,
          },
        },
      });

      return { status: "deleted" as const };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { status: "not_found" as const };
    }

    throw error;
  }
}
