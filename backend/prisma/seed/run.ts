import { getPrismaClient } from "../../src/lib/prisma.js";
import {
  seedAttributes,
  seedPositions,
  seedTags,
} from "./catalog.seed.js";
import {
  seedCandidates,
  seedProfileAttributes,
} from "./candidate.seed.js";
import {
  seedCvs,
  seedProjects,
} from "./experience.seed.js";

export function seedDemoData(passwordHash: string) {
  return getPrismaClient().$transaction(
    async (transaction) => {
      const {
        attributesByName,
        optionsByAttributeAndValue,
      } = await seedAttributes(transaction);
      const tagsByName = await seedTags(transaction);
      const positionsByName = await seedPositions(
        transaction,
        attributesByName,
        tagsByName,
      );
      const {
        candidatesByEmail,
        profilesByCandidateId,
      } = await seedCandidates(transaction, passwordHash);

      await seedProfileAttributes(
        transaction,
        candidatesByEmail,
        profilesByCandidateId,
        attributesByName,
        optionsByAttributeAndValue,
      );
      await seedProjects(
        transaction,
        candidatesByEmail,
        profilesByCandidateId,
        tagsByName,
      );
      await seedCvs(
        transaction,
        candidatesByEmail,
        profilesByCandidateId,
        positionsByName,
      );

      const [attributes, positions, candidates, projects, cvs] =
        await Promise.all([
          transaction.attribute.count(),
          transaction.position.count(),
          transaction.candidate.count(),
          transaction.project.count(),
          transaction.cv.count(),
        ]);

      return { attributes, positions, candidates, projects, cvs };
    },
    { maxWait: 30_000, timeout: 60_000 },
  );
}
