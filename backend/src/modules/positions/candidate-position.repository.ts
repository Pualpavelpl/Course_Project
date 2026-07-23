import { Prisma } from "../../generated/prisma/client.js";
import { getPrismaClient } from "../../lib/prisma.js";

interface CandidatePositionListInput {
  profileId: string;
  skip: number;
  take: number;
  search?: string | undefined;
}

interface CandidatePositionListRow {
  id: string;
  name: string;
}

interface CandidatePositionCountRow {
  count: number;
}

function buildCandidateAccessCondition(profileId: string) {
  return Prisma.sql`
    (
      p."is_public" = TRUE
      OR (
        pa."id" IS NOT NULL
        AND CASE
          WHEN a."type"::text = 'SINGLE_SELECT' THEN
            CASE p."access_operator"::text
              WHEN 'EQUALS' THEN pa."option_id" = p."access_option_id"
              WHEN 'NOT_EQUALS' THEN pa."option_id" <> p."access_option_id"
              ELSE FALSE
            END
          WHEN a."type"::text = 'NUMBER' THEN
            CASE p."access_operator"::text
              WHEN 'EQUALS' THEN
                (CASE WHEN pa."value" ~ '^-?[0-9]+([.][0-9]+)?$' THEN pa."value"::numeric END) =
                (CASE WHEN p."access_value" ~ '^-?[0-9]+([.][0-9]+)?$' THEN p."access_value"::numeric END)
              WHEN 'NOT_EQUALS' THEN
                (CASE WHEN pa."value" ~ '^-?[0-9]+([.][0-9]+)?$' THEN pa."value"::numeric END) <>
                (CASE WHEN p."access_value" ~ '^-?[0-9]+([.][0-9]+)?$' THEN p."access_value"::numeric END)
              WHEN 'GREATER_THAN' THEN
                (CASE WHEN pa."value" ~ '^-?[0-9]+([.][0-9]+)?$' THEN pa."value"::numeric END) >
                (CASE WHEN p."access_value" ~ '^-?[0-9]+([.][0-9]+)?$' THEN p."access_value"::numeric END)
              WHEN 'GREATER_OR_EQUAL' THEN
                (CASE WHEN pa."value" ~ '^-?[0-9]+([.][0-9]+)?$' THEN pa."value"::numeric END) >=
                (CASE WHEN p."access_value" ~ '^-?[0-9]+([.][0-9]+)?$' THEN p."access_value"::numeric END)
              WHEN 'LESS_THAN' THEN
                (CASE WHEN pa."value" ~ '^-?[0-9]+([.][0-9]+)?$' THEN pa."value"::numeric END) <
                (CASE WHEN p."access_value" ~ '^-?[0-9]+([.][0-9]+)?$' THEN p."access_value"::numeric END)
              WHEN 'LESS_OR_EQUAL' THEN
                (CASE WHEN pa."value" ~ '^-?[0-9]+([.][0-9]+)?$' THEN pa."value"::numeric END) <=
                (CASE WHEN p."access_value" ~ '^-?[0-9]+([.][0-9]+)?$' THEN p."access_value"::numeric END)
              ELSE FALSE
            END
          WHEN a."type"::text = 'DATE' THEN
            CASE p."access_operator"::text
              WHEN 'EQUALS' THEN
                (CASE WHEN pa."value" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN pa."value"::date END) =
                (CASE WHEN p."access_value" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN p."access_value"::date END)
              WHEN 'NOT_EQUALS' THEN
                (CASE WHEN pa."value" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN pa."value"::date END) <>
                (CASE WHEN p."access_value" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN p."access_value"::date END)
              WHEN 'GREATER_THAN' THEN
                (CASE WHEN pa."value" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN pa."value"::date END) >
                (CASE WHEN p."access_value" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN p."access_value"::date END)
              WHEN 'GREATER_OR_EQUAL' THEN
                (CASE WHEN pa."value" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN pa."value"::date END) >=
                (CASE WHEN p."access_value" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN p."access_value"::date END)
              WHEN 'LESS_THAN' THEN
                (CASE WHEN pa."value" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN pa."value"::date END) <
                (CASE WHEN p."access_value" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN p."access_value"::date END)
              WHEN 'LESS_OR_EQUAL' THEN
                (CASE WHEN pa."value" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN pa."value"::date END) <=
                (CASE WHEN p."access_value" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN p."access_value"::date END)
              ELSE FALSE
            END
          WHEN a."type"::text = 'BOOLEAN' THEN
            CASE p."access_operator"::text
              WHEN 'EQUALS' THEN lower(pa."value") = lower(p."access_value")
              WHEN 'NOT_EQUALS' THEN lower(pa."value") <> lower(p."access_value")
              ELSE FALSE
            END
          ELSE
            CASE p."access_operator"::text
              WHEN 'EQUALS' THEN pa."value" = p."access_value"
              WHEN 'NOT_EQUALS' THEN pa."value" <> p."access_value"
              WHEN 'CONTAINS' THEN
                position(lower(p."access_value") in lower(pa."value")) > 0
              ELSE FALSE
            END
        END
      )
    )
    AND profile."id" = ${profileId}::uuid
  `;
}

function buildCandidatePositionFromSql(profileId: string) {
  return Prisma.sql`
    FROM "Position" p
    CROSS JOIN "Profile" profile
    LEFT JOIN "Profile_attribute" pa
      ON pa."profile_id" = profile."id"
      AND pa."attribute_id" = p."access_attribute_id"
    LEFT JOIN "Attribute" a
      ON a."id" = p."access_attribute_id"
    WHERE ${buildCandidateAccessCondition(profileId)}
  `;
}

export async function findCandidateProfileId(candidateId: string) {
  return getPrismaClient().profile.findUnique({
    where: { candidateId },
    select: { id: true },
  });
}

export async function findAvailablePositionList(
  input: CandidatePositionListInput,
) {
  const prisma = getPrismaClient();
  const searchCondition = input.search
    ? Prisma.sql`AND p."name" ILIKE ${`${input.search}%`}`
    : Prisma.empty;
  const fromSql = buildCandidatePositionFromSql(input.profileId);

  const [items, countRows] = await prisma.$transaction([
    prisma.$queryRaw<CandidatePositionListRow[]>`
      SELECT p."id", p."name"
      ${fromSql}
      ${searchCondition}
      ORDER BY p."name" ASC, p."id" ASC
      LIMIT ${input.take}
      OFFSET ${input.skip}
    `,
    prisma.$queryRaw<CandidatePositionCountRow[]>`
      SELECT count(*)::int AS "count"
      ${fromSql}
      ${searchCondition}
    `,
  ]);

  return {
    items,
    total: countRows[0]?.count ?? 0,
  };
}

export async function findCandidateProfileAttribute(
  candidateId: string,
  attributeId: string,
) {
  return getPrismaClient().profileAttribute.findFirst({
    where: {
      attributeId,
      profile: { candidateId },
    },
    select: {
      value: true,
      optionId: true,
    },
  });
}
