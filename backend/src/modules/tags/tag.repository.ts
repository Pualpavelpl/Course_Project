import type { Prisma } from "../../generated/prisma/client.js";
import { getPrismaClient } from "../../lib/prisma.js";

interface ListTagsInput {
  skip: number;
  take: number;
  search?: string | undefined;
}

export async function findTagList(input: ListTagsInput) {
  const prisma = getPrismaClient();
  const where = input.search
    ? {
        name: {
          startsWith: input.search,
          mode: "insensitive" as const,
        },
      }
    : {};
  const [items, total] = await prisma.$transaction([
    prisma.tag.findMany({
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
    prisma.tag.count({ where }),
  ]);

  return { items, total };
}

export async function ensureTags(
  transaction: Prisma.TransactionClient,
  tagNames: string[],
) {
  if (tagNames.length === 0) {
    return [];
  }

  await transaction.tag.createMany({
    data: tagNames.map((name) => ({ name })),
    skipDuplicates: true,
  });

  return transaction.tag.findMany({
    where: { name: { in: tagNames } },
    select: { id: true, name: true },
  });
}
