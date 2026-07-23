import { beforeEach, describe, expect, it } from "vitest";
import { getPrismaClient } from "../src/lib/prisma.js";
import { hashPassword } from "../src/modules/auth/password.js";
import { demoCandidates } from "../prisma/seed.data.js";
import { seedDemoData } from "../prisma/seed/run.js";

beforeEach(async () => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Seed tests require an isolated test database");
  }

  const prisma = getPrismaClient();

  await prisma.$transaction([
    prisma.candidate.deleteMany(),
    prisma.recruiter.deleteMany(),
    prisma.position.deleteMany(),
    prisma.attribute.deleteMany(),
    prisma.tag.deleteMany(),
  ]);
});

describe("demo seed", () => {
  it("creates useful data and remains idempotent", async () => {
    const passwordHash = await hashPassword("demo-test-password");
    const firstCounts = await seedDemoData(passwordHash);
    const secondCounts = await seedDemoData(passwordHash);
    const prisma = getPrismaClient();
    const candidates = await prisma.candidate.findMany({
      where: {
        email: {
          in: demoCandidates.map(({ email }) => email),
        },
      },
      select: {
        email: true,
        passwordHash: true,
        profile: {
          select: {
            profileAttributes: { select: { id: true } },
            projects: { select: { id: true } },
            cvs: { select: { id: true } },
          },
        },
      },
      orderBy: { email: "asc" },
    });

    expect(firstCounts).toEqual({
      attributes: 5,
      positions: 5,
      candidates: 5,
      projects: 5,
      cvs: 5,
    });
    expect(secondCounts).toEqual(firstCounts);
    expect(candidates).toHaveLength(5);
    expect(
      candidates.every(
        ({ profile }) =>
          profile?.profileAttributes.length === 5 &&
          profile.projects.length === 1 &&
          profile.cvs.length === 1,
      ),
    ).toBe(true);
    expect(
      candidates.every(({ passwordHash: storedPasswordHash }) =>
        storedPasswordHash.startsWith("$2"),
      ),
    ).toBe(true);
  });
});
