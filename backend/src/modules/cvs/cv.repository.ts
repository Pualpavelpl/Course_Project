import { Prisma } from "../../generated/prisma/client.js";
import { getPrismaClient } from "../../lib/prisma.js";

const cvAssemblySelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  profile: {
    select: {
      id: true,
      version: true,
      candidate: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  },
  position: {
    select: {
      id: true,
      name: true,
      description: true,
      maxProjects: true,
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
              isBuiltin: true,
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
          },
        },
        orderBy: [
          { sortOrder: "asc" as const },
          { attributeId: "asc" as const },
        ],
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
        orderBy: [
          { tag: { name: "asc" as const } },
          { tagId: "asc" as const },
        ],
      },
    },
  },
} satisfies Prisma.CvSelect;

interface CvListInput {
  candidateId: string;
  skip: number;
  take: number;
  search?: string | undefined;
}

interface RecruiterCvListInput {
  recruiterId: string;
  skip: number;
  take: number;
  search?: string | undefined;
  positionId?: string | undefined;
  liked?: boolean | undefined;
}

export async function createCv(candidateId: string, positionId: string) {
  try {
    const cv = await getPrismaClient().cv.create({
      data: {
        position: {
          connect: { id: positionId },
        },
        profile: {
          connect: { candidateId },
        },
      },
      select: {
        id: true,
        positionId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { status: "created" as const, cv };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { status: "duplicate" as const };
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { status: "profile_not_found" as const };
    }

    throw error;
  }
}

export async function findCandidateCvList(input: CvListInput) {
  const prisma = getPrismaClient();
  const where = {
    profile: { candidateId: input.candidateId },
    ...(input.search
      ? {
          position: {
            name: {
              startsWith: input.search,
              mode: "insensitive" as const,
            },
          },
        }
      : {}),
  } satisfies Prisma.CvWhereInput;
  const [items, total] = await prisma.$transaction([
    prisma.cv.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        position: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: input.skip,
      take: input.take,
    }),
    prisma.cv.count({ where }),
  ]);

  return { items, total };
}

export async function findRecruiterCvList(input: RecruiterCvListInput) {
  const prisma = getPrismaClient();
  const where = {
    ...(input.search
      ? {
          OR: [
            {
              position: {
                name: {
                  startsWith: input.search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              profile: {
                candidate: {
                  email: {
                    startsWith: input.search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
          ],
        }
      : {}),
    ...(input.positionId ? { positionId: input.positionId } : {}),
    ...(input.liked === true
      ? { cvLikes: { some: { recruiterId: input.recruiterId } } }
      : input.liked === false
        ? { cvLikes: { none: { recruiterId: input.recruiterId } } }
        : {}),
  } satisfies Prisma.CvWhereInput;
  const [items, total] = await prisma.$transaction([
    prisma.cv.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        position: {
          select: { id: true, name: true },
        },
        profile: {
          select: {
            id: true,
            candidate: {
              select: { id: true, email: true },
            },
          },
        },
        _count: {
          select: { cvLikes: true },
        },
        cvLikes: {
          where: { recruiterId: input.recruiterId },
          select: { recruiterId: true },
          take: 1,
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: input.skip,
      take: input.take,
    }),
    prisma.cv.count({ where }),
  ]);

  return { items, total };
}

export async function addCvLike(cvId: string, recruiterId: string) {
  try {
    await getPrismaClient().cvLike.upsert({
      where: {
        cvId_recruiterId: { cvId, recruiterId },
      },
      update: {},
      create: { cvId, recruiterId },
    });

    const cv = await getPrismaClient().cv.findUniqueOrThrow({
      where: { id: cvId },
      select: {
        _count: { select: { cvLikes: true } },
      },
    });

    return {
      status: "liked" as const,
      likeCount: cv["_count"].cvLikes,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2003" || error.code === "P2025")
    ) {
      return { status: "not_found" as const };
    }

    throw error;
  }
}

export async function removeCvLike(cvId: string, recruiterId: string) {
  const prisma = getPrismaClient();
  const cv = await prisma.cv.findUnique({
    where: { id: cvId },
    select: { id: true },
  });

  if (!cv) {
    return { status: "not_found" as const };
  }

  await prisma.cvLike.deleteMany({ where: { cvId, recruiterId } });
  return { status: "removed" as const };
}

export async function findCandidateCvForAssembly(
  candidateId: string,
  cvId: string,
) {
  return getPrismaClient().cv.findFirst({
    where: {
      id: cvId,
      profile: { candidateId },
    },
    select: cvAssemblySelect,
  });
}

export async function findRecruiterCvForAssembly(cvId: string) {
  return getPrismaClient().cv.findUnique({
    where: { id: cvId },
    select: cvAssemblySelect,
  });
}

export async function findCvAssemblyContent(
  profileId: string,
  attributeIds: string[],
  tagIds: string[],
  maxProjects: number,
) {
  const prisma = getPrismaClient();
  const [profileAttributes, projects] = await prisma.$transaction([
    prisma.profileAttribute.findMany({
      where: {
        profileId,
        attributeId: { in: attributeIds },
      },
      select: {
        attributeId: true,
        value: true,
        optionId: true,
        option: {
          select: {
            value: true,
          },
        },
      },
    }),
    prisma.project.findMany({
      where: {
        profileId,
        projectTags: {
          some: {
            tagId: { in: tagIds },
          },
        },
      },
      select: {
        id: true,
        name: true,
        periodStart: true,
        periodEnd: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        projectTags: {
          select: {
            tag: {
              select: { id: true, name: true },
            },
          },
          orderBy: [
            { tag: { name: "asc" as const } },
            { tagId: "asc" as const },
          ],
        },
      },
      orderBy: [
        { periodEnd: { sort: "desc", nulls: "first" } },
        { periodStart: "desc" },
        { updatedAt: "desc" },
        { id: "asc" },
      ],
      take: maxProjects,
    }),
  ]);

  return { profileAttributes, projects };
}

export async function deleteCandidateCv(
  candidateId: string,
  cvId: string,
) {
  const result = await getPrismaClient().cv.deleteMany({
    where: {
      id: cvId,
      profile: { candidateId },
    },
  });

  return {
    status: result.count > 0
      ? ("deleted" as const)
      : ("not_found" as const),
  };
}
