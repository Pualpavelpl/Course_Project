import { demoCandidates } from "../seed.data.js";
import {
  requireRecord,
  type NamedRecord,
  type TransactionClient,
} from "./shared.js";

export interface CandidateRecord {
  id: string;
  email: string;
}

export interface ProfileRecord {
  id: string;
  candidateId: string;
}

interface AttributeOptionRecord {
  id: string;
  attributeId: string;
  value: string;
}

export async function seedCandidates(
  transaction: TransactionClient,
  passwordHash: string,
) {
  const emails = demoCandidates.map(({ email }) => email);

  await transaction.candidate.createMany({
    data: demoCandidates.map(({ email }) => ({
      email,
      passwordHash,
    })),
    skipDuplicates: true,
  });

  const candidates = await transaction.candidate.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true },
  });
  const candidatesByEmail = new Map(
    candidates.map((candidate) => [candidate.email, candidate]),
  );

  await transaction.profile.createMany({
    data: candidates.map(({ id }) => ({ candidateId: id })),
    skipDuplicates: true,
  });

  const profiles = await transaction.profile.findMany({
    where: { candidateId: { in: candidates.map(({ id }) => id) } },
    select: { id: true, candidateId: true },
  });
  const profilesByCandidateId = new Map(
    profiles.map((profile) => [profile.candidateId, profile]),
  );

  return { candidatesByEmail, profilesByCandidateId };
}

function getProfile(
  candidate: CandidateRecord,
  profilesByCandidateId: Map<string, ProfileRecord>,
): ProfileRecord {
  const profile = profilesByCandidateId.get(candidate.id);

  if (!profile) {
    throw new Error(`Profile is unavailable: ${candidate.email}`);
  }

  return profile;
}

export async function seedProfileAttributes(
  transaction: TransactionClient,
  candidatesByEmail: Map<string, CandidateRecord>,
  profilesByCandidateId: Map<string, ProfileRecord>,
  attributesByName: Map<string, NamedRecord>,
  optionsByAttributeAndValue: Map<
    string,
    AttributeOptionRecord
  >,
) {
  const englishAttribute = requireRecord(
    attributesByName,
    "English proficiency",
  );

  await transaction.profileAttribute.createMany({
    data: demoCandidates.flatMap((candidate) => {
      const candidateRecord = requireRecord(
        candidatesByEmail,
        candidate.email,
      );
      const profile = getProfile(
        candidateRecord,
        profilesByCandidateId,
      );
      const [firstName = "", ...lastNameParts] =
        candidate.fullName.split(" ");
      const valueByAttributeName = new Map([
        ["First Name", firstName],
        ["Last Name", lastNameParts.join(" ")],
        ["Location", candidate.location],
        [
          "Years of professional experience",
          candidate.experienceYears,
        ],
        ["Collaboration style", candidate.collaborationStyle],
      ]);
      const regularValues = [...valueByAttributeName].map(
        ([attributeName, value]) => ({
          profileId: profile.id,
          attributeId: requireRecord(
            attributesByName,
            attributeName,
          ).id,
          value,
        }),
      );
      const englishOption = optionsByAttributeAndValue.get(
        `${englishAttribute.id}:${candidate.englishLevel}`,
      );

      if (!englishOption) {
        throw new Error(
          `English option is unavailable: ${candidate.englishLevel}`,
        );
      }

      return [
        ...regularValues,
        {
          profileId: profile.id,
          attributeId: englishAttribute.id,
          optionId: englishOption.id,
        },
      ];
    }),
    skipDuplicates: true,
  });
}

export { getProfile };
