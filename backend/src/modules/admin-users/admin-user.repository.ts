import { Prisma } from "../../generated/prisma/client.js";
import { getPrismaClient } from "../../lib/prisma.js";

export type AdminUserStatus = "ACTIVE" | "BLOCKED";
export type AdminUserRole = "CANDIDATE" | "RECRUITER" | "ADMIN";

interface AdminUserRow {
  id: string;
  email: string;
  displayName: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  profileId: string | null;
  createdAt: Date;
}

interface CountRow {
  count: bigint;
}

interface FindAdminUsersInput {
  skip: number;
  take: number;
  search?: string | undefined;
  role?: AdminUserRole | undefined;
  status?: AdminUserStatus | undefined;
}

const adminUserProjection = Prisma.sql`
  WITH "AdminUserProjection" AS (
    SELECT
      candidate."id" AS "id",
      candidate."email" AS "email",
      COALESCE(candidate_name."displayName", candidate."email") AS "displayName",
      'CANDIDATE'::text AS "role",
      CASE
        WHEN candidate."is_blocked" THEN 'BLOCKED'::text
        ELSE 'ACTIVE'::text
      END AS "status",
      profile."id" AS "profileId",
      candidate."created_at" AS "createdAt"
    FROM "Candidate" AS candidate
    LEFT JOIN "Profile" AS profile
      ON profile."candidate_id" = candidate."id"
    LEFT JOIN LATERAL (
      SELECT
        COALESCE(
          NULLIF(BTRIM(attribute_option."value"), ''),
          NULLIF(BTRIM(profile_attribute."value"), '')
        ) AS "displayName"
      FROM "Profile_attribute" AS profile_attribute
      INNER JOIN "Attribute" AS attribute
        ON attribute."id" = profile_attribute."attribute_id"
      LEFT JOIN "Attribute_option" AS attribute_option
        ON attribute_option."id" = profile_attribute."option_id"
      WHERE profile_attribute."profile_id" = profile."id"
        AND attribute."is_builtin" = true
        AND COALESCE(
          NULLIF(BTRIM(attribute_option."value"), ''),
          NULLIF(BTRIM(profile_attribute."value"), '')
        ) IS NOT NULL
      ORDER BY attribute."name" ASC, profile_attribute."id" ASC
      LIMIT 1
    ) AS candidate_name ON true

    UNION ALL

    SELECT
      recruiter."id" AS "id",
      recruiter."email" AS "email",
      recruiter."email" AS "displayName",
      CASE
        WHEN admin."recruiter_id" IS NULL THEN 'RECRUITER'::text
        ELSE 'ADMIN'::text
      END AS "role",
      CASE
        WHEN recruiter."is_blocked" THEN 'BLOCKED'::text
        ELSE 'ACTIVE'::text
      END AS "status",
      NULL::uuid AS "profileId",
      recruiter."created_at" AS "createdAt"
    FROM "Recruiter" AS recruiter
    LEFT JOIN "Admin" AS admin
      ON admin."recruiter_id" = recruiter."id"
  )
`;

function createAdminUserFilter(input: FindAdminUsersInput): Prisma.Sql {
  const search = input.search ? `%${input.search}%` : null;
  const role = input.role ?? null;
  const status = input.status ?? null;

  return Prisma.sql`
    WHERE (${search}::text IS NULL
      OR "email" ILIKE ${search}
      OR "displayName" ILIKE ${search})
      AND (${role}::text IS NULL OR "role" = ${role})
      AND (${status}::text IS NULL OR "status" = ${status})
  `;
}

export async function findAdminUsers(input: FindAdminUsersInput) {
  const filter = createAdminUserFilter(input);
  const prisma = getPrismaClient();

  return prisma.$transaction(async (transaction) => {
    const items = await transaction.$queryRaw<AdminUserRow[]>(Prisma.sql`
      ${adminUserProjection}
      SELECT
        "id",
        "email",
        "displayName",
        "role",
        "status",
        "profileId",
        "createdAt"
      FROM "AdminUserProjection"
      ${filter}
      ORDER BY LOWER("email") ASC, "id" ASC
      LIMIT ${input.take}
      OFFSET ${input.skip}
    `);
    const [countRow] = await transaction.$queryRaw<CountRow[]>(Prisma.sql`
      ${adminUserProjection}
      SELECT COUNT("id") AS "count"
      FROM "AdminUserProjection"
      ${filter}
    `);

    return {
      items,
      total: Number(countRow?.count ?? 0),
    };
  });
}

interface IdentityIds {
  candidateIds: string[];
  employeeIds: string[];
}

export async function setUsersBlocked(
  ids: IdentityIds,
  isBlocked: boolean,
) {
  return getPrismaClient().$transaction(async (transaction) => {
    const candidateCount =
      ids.candidateIds.length === 0
        ? 0
        : (
            await transaction.candidate.updateMany({
              where: { id: { in: ids.candidateIds } },
              data: { isBlocked },
            })
          ).count;
    const employeeCount =
      ids.employeeIds.length === 0
        ? 0
        : (
            await transaction.recruiter.updateMany({
              where: { id: { in: ids.employeeIds } },
              data: { isBlocked },
            })
          ).count;

    return candidateCount + employeeCount;
  });
}

export async function deleteUsers(ids: IdentityIds): Promise<number> {
  return getPrismaClient().$transaction(async (transaction) => {
    const candidateCount =
      ids.candidateIds.length === 0
        ? 0
        : (
            await transaction.candidate.deleteMany({
              where: { id: { in: ids.candidateIds } },
            })
          ).count;
    const employeeCount =
      ids.employeeIds.length === 0
        ? 0
        : (
            await transaction.recruiter.deleteMany({
              where: { id: { in: ids.employeeIds } },
            })
          ).count;

    return candidateCount + employeeCount;
  });
}

export async function promoteRecruiter(recruiterId: string) {
  return getPrismaClient().$transaction(async (transaction) => {
    const recruiter = await transaction.recruiter.findUnique({
      where: { id: recruiterId },
      select: {
        id: true,
        admin: {
          select: {
            createdAt: true,
          },
        },
      },
    });

    if (!recruiter) {
      return { status: "not_found" as const };
    }

    if (recruiter.admin) {
      return { status: "already_admin" as const };
    }

    const admin = await transaction.admin.create({
      data: { recruiterId },
      select: {
        recruiterId: true,
        createdAt: true,
      },
    });

    return { status: "promoted" as const, admin };
  });
}
