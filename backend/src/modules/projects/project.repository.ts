import { Prisma } from "../../generated/prisma/client.js";
import { getPrismaClient } from "../../lib/prisma.js";
import { ensureTags } from "../tags/tag.repository.js";

const projectDetailSelect = {
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
    orderBy: [{ tag: { name: "asc" as const } }, { tagId: "asc" as const }],
  },
} satisfies Prisma.ProjectSelect;

export interface ProjectWriteInput {
  name: string;
  periodStart: Date;
  periodEnd: Date | null;
  description: string;
  tagNames: string[];
}

export async function findProjectsByCandidateId(candidateId: string) {
  return getPrismaClient().project.findMany({
    where: { profile: { candidateId } },
    select: projectDetailSelect,
    orderBy: [
      { periodStart: "desc" },
      { createdAt: "desc" },
      { id: "asc" },
    ],
  });
}

export async function findProjectByCandidateId(
  candidateId: string,
  projectId: string,
) {
  return getPrismaClient().project.findFirst({
    where: {
      id: projectId,
      profile: { candidateId },
    },
    select: projectDetailSelect,
  });
}

async function replaceProjectTags(
  transaction: Prisma.TransactionClient,
  projectId: string,
  tagNames: string[],
): Promise<void> {
  const tags = await ensureTags(transaction, tagNames);

  await transaction.projectTag.deleteMany({ where: { projectId } });

  if (tags.length > 0) {
    await transaction.projectTag.createMany({
      data: tags.map(({ id: tagId }) => ({ projectId, tagId })),
    });
  }
}

export async function createProject(
  candidateId: string,
  input: ProjectWriteInput,
) {
  return getPrismaClient().$transaction(async (transaction) => {
    const profile = await transaction.profile.findUnique({
      where: { candidateId },
      select: { id: true },
    });

    if (!profile) {
      return { status: "profile_not_found" as const };
    }

    const project = await transaction.project.create({
      data: {
        profileId: profile.id,
        name: input.name,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        description: input.description,
      },
      select: { id: true },
    });

    await replaceProjectTags(
      transaction,
      project.id,
      input.tagNames,
    );

    return {
      status: "created" as const,
      project: await transaction.project.findUniqueOrThrow({
        where: { id: project.id },
        select: projectDetailSelect,
      }),
    };
  });
}

export async function updateProject(
  candidateId: string,
  projectId: string,
  input: ProjectWriteInput,
) {
  return getPrismaClient().$transaction(async (transaction) => {
    const updateResult = await transaction.project.updateMany({
      where: {
        id: projectId,
        profile: { candidateId },
      },
      data: {
        name: input.name,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        description: input.description,
      },
    });

    if (updateResult.count === 0) {
      return { status: "not_found" as const };
    }

    await replaceProjectTags(transaction, projectId, input.tagNames);

    return {
      status: "updated" as const,
      project: await transaction.project.findUniqueOrThrow({
        where: { id: projectId },
        select: projectDetailSelect,
      }),
    };
  });
}

export async function deleteProject(
  candidateId: string,
  projectId: string,
) {
  const result = await getPrismaClient().project.deleteMany({
    where: {
      id: projectId,
      profile: { candidateId },
    },
  });

  return {
    status: result.count > 0
      ? ("deleted" as const)
      : ("not_found" as const),
  };
}
