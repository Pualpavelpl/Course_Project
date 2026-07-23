import { demoCandidates } from "../seed.data.js";
import {
  getProfile,
  type CandidateRecord,
  type ProfileRecord,
} from "./candidate.seed.js";
import {
  requireRecord,
  type NamedRecord,
  type TransactionClient,
} from "./shared.js";

export async function seedProjects(
  transaction: TransactionClient,
  candidatesByEmail: Map<string, CandidateRecord>,
  profilesByCandidateId: Map<string, ProfileRecord>,
  tagsByName: Map<string, NamedRecord>,
) {
  const projectNames = demoCandidates.map(
    ({ project }) => project.name,
  );
  const profileIds = [...profilesByCandidateId.values()].map(
    ({ id }) => id,
  );
  const existingProjects = await transaction.project.findMany({
    where: {
      profileId: { in: profileIds },
      name: { in: projectNames },
    },
    select: { id: true, profileId: true, name: true },
  });
  const existingKeys = new Set(
    existingProjects.map(
      ({ profileId, name }) => `${profileId}:${name}`,
    ),
  );

  await transaction.project.createMany({
    data: demoCandidates.flatMap((candidate) => {
      const candidateRecord = requireRecord(
        candidatesByEmail,
        candidate.email,
      );
      const profile = getProfile(
        candidateRecord,
        profilesByCandidateId,
      );
      const key = `${profile.id}:${candidate.project.name}`;

      if (existingKeys.has(key)) {
        return [];
      }

      return [
        {
          profileId: profile.id,
          name: candidate.project.name,
          periodStart: new Date(candidate.project.periodStart),
          periodEnd: candidate.project.periodEnd
            ? new Date(candidate.project.periodEnd)
            : null,
          description: candidate.project.description,
        },
      ];
    }),
  });

  const projects = await transaction.project.findMany({
    where: {
      profileId: { in: profileIds },
      name: { in: projectNames },
    },
    select: { id: true, profileId: true, name: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const projectsByProfileAndName = new Map(
    projects.map((project) => [
      `${project.profileId}:${project.name}`,
      project,
    ]),
  );

  await transaction.projectTag.createMany({
    data: demoCandidates.flatMap((candidate) => {
      const candidateRecord = requireRecord(
        candidatesByEmail,
        candidate.email,
      );
      const profile = getProfile(
        candidateRecord,
        profilesByCandidateId,
      );
      const project = projectsByProfileAndName.get(
        `${profile.id}:${candidate.project.name}`,
      );

      if (!project) {
        throw new Error(
          `Project is unavailable: ${candidate.project.name}`,
        );
      }

      return candidate.project.tagNames.map((tagName) => ({
        projectId: project.id,
        tagId: requireRecord(tagsByName, tagName).id,
      }));
    }),
    skipDuplicates: true,
  });
}

export async function seedCvs(
  transaction: TransactionClient,
  candidatesByEmail: Map<string, CandidateRecord>,
  profilesByCandidateId: Map<string, ProfileRecord>,
  positionsByName: Map<string, NamedRecord>,
) {
  await transaction.cv.createMany({
    data: demoCandidates.map((candidate) => {
      const candidateRecord = requireRecord(
        candidatesByEmail,
        candidate.email,
      );
      const profile = getProfile(
        candidateRecord,
        profilesByCandidateId,
      );

      return {
        profileId: profile.id,
        positionId: requireRecord(
          positionsByName,
          candidate.positionName,
        ).id,
      };
    }),
    skipDuplicates: true,
  });
}
