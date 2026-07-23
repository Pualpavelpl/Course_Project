import {
  Prisma,
  type AccessOperator,
} from "../../generated/prisma/client.js";
import { getPrismaClient } from "../../lib/prisma.js";
import { ensureTags } from "../tags/tag.repository.js";

export const positionDetailSelect = {
  id: true,
  name: true,
  description: true,
  isPublic: true,
  maxProjects: true,
  version: true,
  accessAttributeId: true,
  accessOperator: true,
  accessOptionId: true,
  accessValue: true,
  createdAt: true,
  updatedAt: true,
  accessAttribute: {
    select: {
      id: true,
      name: true,
      type: true,
      options: {
        select: { id: true },
      },
    },
  },
  accessOption: {
    select: {
      id: true,
      value: true,
    },
  },
  positionAttributes: {
    select: {
      sortOrder: true,
      attribute: {
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          category: true,
        },
      },
    },
    orderBy: [{ sortOrder: "asc" as const }, { attributeId: "asc" as const }],
  },
  positionTags: {
    select: {
      tag: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ tag: { name: "asc" as const } }, { tagId: "asc" as const }],
  },
} satisfies Prisma.PositionSelect;

export interface PositionWriteInput {
  name: string;
  description: string;
  maxProjects: number;
  attributeIds: string[];
  tagNames: string[];
  isPublic: boolean;
  accessAttributeId: string | null;
  accessOperator: AccessOperator | null;
  accessOptionId: string | null;
  accessValue: string | null;
}

interface PositionListInput {
  skip: number;
  take: number;
  search?: string | undefined;
}

interface UpdatePositionInput extends PositionWriteInput {
  id: string;
  version: number;
}

function buildPositionWhere(search?: string) {
  return search
    ? {
        name: {
          startsWith: search,
          mode: "insensitive" as const,
        },
      }
    : {};
}

async function createPositionJoins(
  transaction: Prisma.TransactionClient,
  positionId: string,
  attributeIds: string[],
  tagIds: string[],
): Promise<void> {
  await transaction.positionAttribute.createMany({
    data: attributeIds.map((attributeId, sortOrder) => ({
      positionId,
      attributeId,
      sortOrder,
    })),
  });

  if (tagIds.length > 0) {
    await transaction.positionTag.createMany({
      data: tagIds.map((tagId) => ({ positionId, tagId })),
    });
  }
}

export async function findPositionList(input: PositionListInput) {
  const prisma = getPrismaClient();
  const where = buildPositionWhere(input.search);
  const [items, total] = await prisma.$transaction([
    prisma.position.findMany({
      where,
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      skip: input.skip,
      take: input.take,
    }),
    prisma.position.count({ where }),
  ]);

  return { items, total };
}

export async function findPositionById(id: string) {
  return getPrismaClient().position.findUnique({
    where: { id },
    select: positionDetailSelect,
  });
}

export async function findPositionAttributesByIds(ids: string[]) {
  return getPrismaClient().attribute.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      type: true,
      options: {
        select: { id: true },
      },
    },
  });
}

export async function createPosition(input: PositionWriteInput) {
  return getPrismaClient().$transaction(async (transaction) => {
    const tags = await ensureTags(transaction, input.tagNames);
    const position = await transaction.position.create({
      data: {
        name: input.name,
        description: input.description,
        maxProjects: input.maxProjects,
        isPublic: input.isPublic,
        accessAttributeId: input.accessAttributeId,
        accessOperator: input.accessOperator,
        accessOptionId: input.accessOptionId,
        accessValue: input.accessValue,
      },
      select: { id: true },
    });

    await createPositionJoins(
      transaction,
      position.id,
      input.attributeIds,
      tags.map((tag) => tag.id),
    );

    return transaction.position.findUniqueOrThrow({
      where: { id: position.id },
      select: positionDetailSelect,
    });
  });
}

export async function updatePosition(input: UpdatePositionInput) {
  return getPrismaClient().$transaction(async (transaction) => {
    const updateResult = await transaction.position.updateMany({
      where: {
        id: input.id,
        version: input.version,
      },
      data: {
        name: input.name,
        description: input.description,
        maxProjects: input.maxProjects,
        isPublic: input.isPublic,
        accessAttributeId: input.accessAttributeId,
        accessOperator: input.accessOperator,
        accessOptionId: input.accessOptionId,
        accessValue: input.accessValue,
        version: { increment: 1 },
      },
    });

    if (updateResult.count === 0) {
      const existingPosition = await transaction.position.findUnique({
        where: { id: input.id },
        select: { id: true },
      });

      return {
        status: existingPosition
          ? ("version_conflict" as const)
          : ("not_found" as const),
      };
    }

    const tags = await ensureTags(transaction, input.tagNames);

    await transaction.positionAttribute.deleteMany({
      where: { positionId: input.id },
    });
    await transaction.positionTag.deleteMany({
      where: { positionId: input.id },
    });
    await createPositionJoins(
      transaction,
      input.id,
      input.attributeIds,
      tags.map((tag) => tag.id),
    );

    const position = await transaction.position.findUniqueOrThrow({
      where: { id: input.id },
      select: positionDetailSelect,
    });

    return { status: "updated" as const, position };
  });
}

export async function deletePosition(id: string) {
  try {
    await getPrismaClient().position.delete({
      where: { id },
      select: { id: true },
    });

    return { status: "deleted" as const };
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
