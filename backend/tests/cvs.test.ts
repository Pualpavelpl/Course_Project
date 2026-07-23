import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { getPrismaClient } from "../src/lib/prisma.js";

const candidateCredentials = {
  email: "cv-candidate@example.com",
  password: "correct-password",
};
const otherCandidateCredentials = {
  email: "cv-other@example.com",
  password: "correct-password",
};

let candidateToken: string;
let otherCandidateToken: string;
let recruiterToken: string;

async function createAttribute(name: string, isBuiltin = false) {
  return getPrismaClient().attribute.create({
    data: {
      name,
      description: `${name} description`,
      type: "STRING",
      category: isBuiltin
        ? "PERSONAL_INFORMATION"
        : "DOMAIN_KNOWLEDGE",
      isBuiltin,
    },
  });
}

async function createPosition(
  name: string,
  attributeIds: string[],
  tagNames: string[] = [],
  maxProjects = 3,
) {
  const prisma = getPrismaClient();
  await prisma.tag.createMany({
    data: tagNames.map((tagName) => ({ name: tagName })),
    skipDuplicates: true,
  });
  const tags = await prisma.tag.findMany({
    where: { name: { in: tagNames } },
  });

  return prisma.position.create({
    data: {
      name,
      description: `${name} description`,
      maxProjects,
      positionAttributes: {
        create: attributeIds.map((attributeId, sortOrder) => ({
          attributeId,
          sortOrder,
        })),
      },
      positionTags: {
        create: tags.map(({ id: tagId }) => ({ tagId })),
      },
    },
  });
}

async function createCv(positionId: string, token = candidateToken) {
  return request(app)
    .post("/api/cvs")
    .set("Authorization", `Bearer ${token}`)
    .send({ positionId });
}

async function getCandidateProfile(email = candidateCredentials.email) {
  return getPrismaClient().profile.findFirstOrThrow({
    where: { candidate: { email } },
  });
}

beforeEach(async () => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("CV tests require an isolated test database");
  }

  const prisma = getPrismaClient();
  await prisma.$transaction([
    prisma.candidate.deleteMany(),
    prisma.position.deleteMany(),
    prisma.recruiter.deleteMany(),
    prisma.attribute.deleteMany(),
    prisma.tag.deleteMany(),
  ]);

  candidateToken = (
    await request(app)
      .post("/api/auth/candidates/register")
      .send(candidateCredentials)
  ).body.token as string;
  otherCandidateToken = (
    await request(app)
      .post("/api/auth/candidates/register")
      .send(otherCandidateCredentials)
  ).body.token as string;

  const recruiterPassword = "recruiter-password";
  await prisma.recruiter.create({
    data: {
      email: "cv-recruiter@example.com",
      passwordHash: await bcrypt.hash(recruiterPassword, 12),
    },
  });
  recruiterToken = (
    await request(app)
      .post("/api/auth/recruiters/login")
      .send({
        email: "cv-recruiter@example.com",
        password: recruiterPassword,
      })
  ).body.token as string;
});

describe("CV creation and access", () => {
  it("creates only one CV row for a Profile and Position", async () => {
    const attribute = await createAttribute("CV Attribute");
    const position = await createPosition("Frontend", [attribute.id]);

    const firstResponse = await createCv(position.id);
    const duplicateResponse = await createCv(position.id);

    expect(firstResponse.status).toBe(201);
    expect(firstResponse.body.positionId).toBe(position.id);
    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.error.code).toBe("CV_POSITION_CONFLICT");
    await expect(getPrismaClient().cv.count()).resolves.toBe(1);
  });

  it("rejects CV creation when the Position access rule is not satisfied", async () => {
    const attribute = await getPrismaClient().attribute.create({
      data: {
        name: "Experience",
        description: "Experience",
        type: "NUMBER",
        category: "DOMAIN_KNOWLEDGE",
      },
    });
    const position = await getPrismaClient().position.create({
      data: {
        name: "Senior",
        description: "Senior",
        isPublic: false,
        accessAttributeId: attribute.id,
        accessOperator: "GREATER_OR_EQUAL",
        accessValue: "5",
        positionAttributes: {
          create: { attributeId: attribute.id, sortOrder: 0 },
        },
      },
    });

    const response = await createCv(position.id);

    expect(response.status).toBe(404);
    await expect(getPrismaClient().cv.count()).resolves.toBe(0);
  });

  it("keeps Candidate ownership and gives Recruiter read-only detail access", async () => {
    const attribute = await createAttribute("Owned Attribute");
    const position = await createPosition("Owned CV", [attribute.id]);
    const creationResponse = await createCv(position.id);
    const cvId = creationResponse.body.id as string;

    const otherCandidateResponse = await request(app)
      .get(`/api/cvs/${cvId}`)
      .set("Authorization", `Bearer ${otherCandidateToken}`);
    const recruiterResponse = await request(app)
      .get(`/api/cvs/search/${cvId}`)
      .set("Authorization", `Bearer ${recruiterToken}`);
    const recruiterDeleteResponse = await request(app)
      .delete(`/api/cvs/${cvId}`)
      .set("Authorization", `Bearer ${recruiterToken}`);

    expect(otherCandidateResponse.status).toBe(404);
    expect(recruiterResponse.status).toBe(200);
    expect(recruiterResponse.body.profile.candidate.email).toBe(
      candidateCredentials.email,
    );
    expect(recruiterResponse.body.profile.candidate).not.toHaveProperty(
      "passwordHash",
    );
    expect(recruiterDeleteResponse.status).toBe(403);
  });
});

describe("Dynamic CV assembly", () => {
  it("assembles ordered Attributes and recent matching Projects without copies", async () => {
    const meAttribute = await createAttribute("Full name", true);
    const skillAttribute = await createAttribute("Main skill");
    const position = await createPosition(
      "Dynamic CV",
      [skillAttribute.id, meAttribute.id],
      ["React"],
      2,
    );
    const profile = await getCandidateProfile();
    await getPrismaClient().profileAttribute.createMany({
      data: [
        {
          profileId: profile.id,
          attributeId: meAttribute.id,
          value: "Ada Lovelace",
        },
        {
          profileId: profile.id,
          attributeId: skillAttribute.id,
          value: "TypeScript",
        },
      ],
    });
    const reactTag = await getPrismaClient().tag.findUniqueOrThrow({
      where: { name: "React" },
    });
    const otherTag = await getPrismaClient().tag.create({
      data: { name: "Java" },
    });
    await getPrismaClient().project.create({
      data: {
        profileId: profile.id,
        name: "Newest matching",
        periodStart: new Date("2026-01-01T00:00:00.000Z"),
        description: "Newest",
        projectTags: { create: { tagId: reactTag.id } },
      },
    });
    await getPrismaClient().project.create({
      data: {
        profileId: profile.id,
        name: "Older matching",
        periodStart: new Date("2025-01-01T00:00:00.000Z"),
        periodEnd: new Date("2025-12-31T00:00:00.000Z"),
        description: "Older",
        projectTags: { create: { tagId: reactTag.id } },
      },
    });
    await getPrismaClient().project.create({
      data: {
        profileId: profile.id,
        name: "Too old matching",
        periodStart: new Date("2024-01-01T00:00:00.000Z"),
        periodEnd: new Date("2024-12-31T00:00:00.000Z"),
        description: "Too old",
        projectTags: { create: { tagId: reactTag.id } },
      },
    });
    await getPrismaClient().project.create({
      data: {
        profileId: profile.id,
        name: "Unmatched",
        periodStart: new Date("2027-01-01T00:00:00.000Z"),
        description: "Unmatched",
        projectTags: { create: { tagId: otherTag.id } },
      },
    });
    const creationResponse = await createCv(position.id);

    const response = await request(app)
      .get(`/api/cvs/${creationResponse.body.id as string}`)
      .set("Authorization", `Bearer ${candidateToken}`);

    expect(response.status).toBe(200);
    expect(
      response.body.attributes.map(
        ({ name }: { name: string }) => name,
      ),
    ).toEqual(["Main skill", "Full name"]);
    expect(
      response.body.projects.map(({ name }: { name: string }) => name),
    ).toEqual(["Newest matching", "Older matching"]);
    expect(response.body).not.toHaveProperty("content");
    expect(response.body).not.toHaveProperty("status");
    expect(response.body).not.toHaveProperty("publishedAt");
  });

  it("saves Profile Attribute changes and exposes them in every matching CV", async () => {
    const attribute = await createAttribute("Shared value");
    const firstPosition = await createPosition("First", [attribute.id]);
    const secondPosition = await createPosition("Second", [attribute.id]);
    const firstCv = await createCv(firstPosition.id);
    const secondCv = await createCv(secondPosition.id);
    const profileResponse = await request(app)
      .get("/api/profile/me")
      .set("Authorization", `Bearer ${candidateToken}`);

    const saveResponse = await request(app)
      .patch(`/api/cvs/${firstCv.body.id as string}/profile-attributes`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({
        version: profileResponse.body.version,
        attributes: [
          { attributeId: attribute.id, value: "Updated once" },
        ],
      });
    const secondDetail = await request(app)
      .get(`/api/cvs/${secondCv.body.id as string}`)
      .set("Authorization", `Bearer ${candidateToken}`);

    expect(saveResponse.status).toBe(200);
    expect(saveResponse.body.attributes[0].displayValue).toBe(
      "Updated once",
    );
    expect(secondDetail.body.attributes[0].displayValue).toBe(
      "Updated once",
    );
    await expect(
      getPrismaClient().profileAttribute.count({
        where: { profileId: profileResponse.body.id as string },
      }),
    ).resolves.toBe(1);
  });

  it("rejects saving an Attribute outside the Position template", async () => {
    const included = await createAttribute("Included");
    const excluded = await createAttribute("Excluded");
    const position = await createPosition("Template", [included.id]);
    const cv = await createCv(position.id);

    const response = await request(app)
      .patch(`/api/cvs/${cv.body.id as string}/profile-attributes`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({
        version: 1,
        attributes: [{ attributeId: excluded.id, value: "No" }],
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("CV_ATTRIBUTE_NOT_IN_TEMPLATE");
  });
});

describe("Candidate CV list and deletion", () => {
  it("supports server pagination/search and ownership-safe deletion", async () => {
    const attribute = await createAttribute("List Attribute");
    const alpha = await createPosition("Alpha", [attribute.id]);
    const beta = await createPosition("Beta", [attribute.id]);
    const alphaCv = await createCv(alpha.id);
    await createCv(beta.id);

    const searchResponse = await request(app)
      .get("/api/cvs?search=Al&page=1&pageSize=1")
      .set("Authorization", `Bearer ${candidateToken}`);
    const otherDeleteResponse = await request(app)
      .delete(`/api/cvs/${alphaCv.body.id as string}`)
      .set("Authorization", `Bearer ${otherCandidateToken}`);
    const deleteResponse = await request(app)
      .delete(`/api/cvs/${alphaCv.body.id as string}`)
      .set("Authorization", `Bearer ${candidateToken}`);

    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body.items).toHaveLength(1);
    expect(searchResponse.body.items[0].position.name).toBe("Alpha");
    expect(searchResponse.body.pagination.total).toBe(1);
    expect(otherDeleteResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(204);
  });
});
