import {
  Prisma,
  type AttributeCategory,
  type AttributeType,
} from "../../generated/prisma/client.js";
import { getPrismaClient } from "../../lib/prisma.js";

const attributeListSelect = {
  id: true,
  name: true,
  description: true,
  category: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AttributeSelect;

const attributeDetailSelect = {
  id: true,
  name: true,
  description: true,
  type: true,
  category: true,
  isBuiltin: true,
  version: true,
  createdAt: true,
  updatedAt: true,
  options: {
    select: {
      id: true,
      value: true,
      sortOrder: true,
    },
    orderBy: [{ sortOrder: "asc" as const }, { id: "asc" as const }],
  },
} satisfies Prisma.AttributeSelect;

interface ListAttributesInput {
  skip: number;
  take: number;
  search?: string | undefined;
  category?: AttributeCategory | undefined;
}

interface CreateAttributeInput {
  name: string;
  description: string;
  type: AttributeType;
  category: AttributeCategory;
  options: string[];
}

interface UpdateAttributeInput {
  id: string;
  version: number;
  name?: string | undefined;
  description?: string | undefined;
  type?: AttributeType | undefined;
  category?: AttributeCategory | undefined;
  options?: string[] | undefined;
}

function buildAttributeWhere({
  search,
  category,
}: Pick<ListAttributesInput, "search" | "category">) {
  return {
    ...(search
      ? {
          name: {
            startsWith: search,
            mode: "insensitive" as const,
          },
        }
      : {}),
    ...(category ? { category } : {}),
  } satisfies Prisma.AttributeWhereInput;
}

export async function findAttributes(input: ListAttributesInput) {
  const prisma = getPrismaClient();
  const where = buildAttributeWhere(input);

  const [items, total] = await prisma.$transaction([
    prisma.attribute.findMany({
      where,
      select: attributeListSelect,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      skip: input.skip,
      take: input.take,
    }),
    prisma.attribute.count({ where }),
  ]);

  return { items, total };
}

export async function findAttributeById(id: string) {
  return getPrismaClient().attribute.findUnique({
    where: { id },
    select: attributeDetailSelect,
  });
}

export async function createAttribute(input: CreateAttributeInput) {
  try {
    const attribute = await getPrismaClient().attribute.create({
      data: {
        name: input.name,
        description: input.description,
        type: input.type,
        category: input.category,
        ...(input.options.length > 0
          ? {
              options: {
                createMany: {
                  data: input.options.map((value, sortOrder) => ({
                    value,
                    sortOrder,
                  })),
                },
              },
            }
          : {}),
      },
      select: attributeDetailSelect,
    });

    return { status: "created" as const, attribute };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { status: "name_conflict" as const };
    }

    throw error;
  }
}

export async function countAttributeOptionUsages(
  attributeId: string,
): Promise<number> {
  const prisma = getPrismaClient();
  const [profileUsages, positionUsages] = await prisma.$transaction([
    prisma.profileAttribute.count({
      where: {
        attributeId,
        optionId: { not: null },
      },
    }),
    prisma.position.count({
      where: {
        accessAttributeId: attributeId,
        accessOptionId: { not: null },
      },
    }),
  ]);

  return profileUsages + positionUsages;
}

export async function updateAttribute(input: UpdateAttributeInput) {
  try {
    return await getPrismaClient().$transaction(async (transaction) => {
      const updateResult = await transaction.attribute.updateMany({
        where: {
          id: input.id,
          version: input.version,
        },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
          ...(input.type !== undefined ? { type: input.type } : {}),
          ...(input.category !== undefined
            ? { category: input.category }
            : {}),
          version: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        const existingAttribute = await transaction.attribute.findUnique({
          where: { id: input.id },
          select: { id: true },
        });

        return {
          status: existingAttribute
            ? ("version_conflict" as const)
            : ("not_found" as const),
        };
      }

      if (input.options !== undefined) {
        await transaction.attributeOption.deleteMany({
          where: { attributeId: input.id },
        });

        if (input.options.length > 0) {
          await transaction.attributeOption.createMany({
            data: input.options.map((value, sortOrder) => ({
              attributeId: input.id,
              value,
              sortOrder,
            })),
          });
        }
      }

      const attribute = await transaction.attribute.findUniqueOrThrow({
        where: { id: input.id },
        select: attributeDetailSelect,
      });

      return { status: "updated" as const, attribute };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { status: "name_conflict" as const };
    }

    throw error;
  }
}

export async function findAttributeDeletionState(id: string) {
  return getPrismaClient().attribute.findUnique({
    where: { id },
    select: {
      id: true,
      isBuiltin: true,
      _count: {
        select: {
          profileAttributes: true,
          positionAttributes: true,
          accessPositions: true,
        },
      },
    },
  });
}

export async function deleteAttribute(id: string) {
  try {
    await getPrismaClient().attribute.delete({
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

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return { status: "relation_conflict" as const };
    }

    throw error;
  }
}
