import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { getPrismaClient } from "../src/lib/prisma.js";

const recruiterCredentials = {
  email: "position-recruiter@example.com",
  password: "correct-password",
};

let recruiterToken: string;

async function createAttributeFixture(
  name: string,
  type:
    | "STRING"
    | "NUMBER"
    | "DATE"
    | "PERIOD"
    | "BOOLEAN"
    | "SINGLE_SELECT" = "STRING",
) {
  return getPrismaClient().attribute.create({
    data: {
      name,
      description: `${name} description`,
      type,
      category: "DOMAIN_KNOWLEDGE",
      ...(type === "SINGLE_SELECT"
        ? {
            options: {
              create: [
                { value: "Junior", sortOrder: 0 },
                { value: "Senior", sortOrder: 1 },
              ],
            },
          }
        : {}),
    },
    include: {
      options: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

function createPublicPositionBody(attributeIds: string[]) {
  return {
    name: "Frontend Developer",
    description: "Frontend Position",
    maxProjects: 3,
    attributeIds,
    tags: ["React", "TypeScript"],
    isPublic: true,
  };
}

async function createPosition(body: object) {
  return request(app)
    .post("/api/positions")
    .set("Authorization", `Bearer ${recruiterToken}`)
    .send(body);
}

beforeEach(async () => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Position tests require an isolated test database");
  }

  const prisma = getPrismaClient();

  await prisma.$transaction([
    prisma.candidate.deleteMany(),
    prisma.position.deleteMany(),
    prisma.recruiter.deleteMany(),
    prisma.attribute.deleteMany(),
    prisma.tag.deleteMany(),
  ]);

  await prisma.recruiter.create({
    data: {
      email: recruiterCredentials.email,
      passwordHash: await bcrypt.hash(recruiterCredentials.password, 12),
    },
  });

  const loginResponse = await request(app)
    .post("/api/auth/recruiters/login")
    .send(recruiterCredentials);

  recruiterToken = loginResponse.body.token as string;
});

describe("Position creation", () => {
  it("creates a public Position", async () => {
    const attribute = await createAttributeFixture("React");

    const response = await createPosition(
      createPublicPositionBody([attribute.id]),
    );

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: "Frontend Developer",
      isPublic: true,
      maxProjects: 3,
      version: 1,
      accessRule: null,
    });
    expect(response.body.attributes[0].id).toBe(attribute.id);
  });

  it("creates a filtered Position with a SINGLE_SELECT rule", async () => {
    const attribute = await createAttributeFixture(
      "Experience level",
      "SINGLE_SELECT",
    );
    const seniorOption = attribute.options[1];

    const response = await createPosition({
      ...createPublicPositionBody([attribute.id]),
      isPublic: false,
      accessRule: {
        attributeId: attribute.id,
        operator: "EQUALS",
        optionId: seniorOption?.id,
      },
    });

    expect(response.status).toBe(201);
    expect(response.body.isPublic).toBe(false);
    expect(response.body.accessRule).toMatchObject({
      attribute: {
        id: attribute.id,
        type: "SINGLE_SELECT",
      },
      operator: "EQUALS",
      option: {
        id: seniorOption?.id,
        value: "Senior",
      },
      value: null,
    });
  });

  it("rejects an operator that is invalid for the Attribute type", async () => {
    const attribute = await createAttributeFixture("Location", "STRING");

    const response = await createPosition({
      ...createPublicPositionBody([attribute.id]),
      isPublic: false,
      accessRule: {
        attributeId: attribute.id,
        operator: "GREATER_THAN",
        value: "Warsaw",
      },
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_ACCESS_RULE");
  });

  it("stores Position Attributes in request order", async () => {
    const first = await createAttributeFixture("First");
    const second = await createAttributeFixture("Second");
    const third = await createAttributeFixture("Third");

    const response = await createPosition(
      createPublicPositionBody([second.id, first.id, third.id]),
    );
    const storedJoins =
      await getPrismaClient().positionAttribute.findMany({
        where: { positionId: response.body.id as string },
        orderBy: { sortOrder: "asc" },
      });

    expect(response.status).toBe(201);
    expect(storedJoins.map((join) => join.attributeId)).toEqual([
      second.id,
      first.id,
      third.id,
    ]);
    expect(storedJoins.map((join) => join.sortOrder)).toEqual([0, 1, 2]);
  });

  it("creates unknown Tags, reuses existing Tags, and avoids duplicate joins", async () => {
    const attribute = await createAttributeFixture("Tag Attribute");
    const existingTag = await getPrismaClient().tag.create({
      data: { name: "React" },
    });

    const response = await createPosition({
      ...createPublicPositionBody([attribute.id]),
      tags: ["React", "Node.js", " react "],
    });
    const tags = await getPrismaClient().tag.findMany({
      orderBy: { name: "asc" },
    });
    const joins = await getPrismaClient().positionTag.findMany({
      where: { positionId: response.body.id as string },
    });

    expect(response.status).toBe(201);
    expect(tags).toHaveLength(2);
    expect(tags.find((tag) => tag.name === "React")?.id).toBe(existingTag.id);
    expect(joins).toHaveLength(2);
  });

  it("rejects duplicate Position Attribute join rows", async () => {
    const attribute = await createAttributeFixture("Duplicate Attribute");

    const response = await createPosition(
      createPublicPositionBody([attribute.id, attribute.id]),
    );

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe(
      "POSITION_ATTRIBUTES_DUPLICATE",
    );
  });
});

describe("Position update and deletion", () => {
  it("updates joins with the correct version and rejects the stale version", async () => {
    const first = await createAttributeFixture("Original");
    const second = await createAttributeFixture("Replacement");
    const creationResponse = await createPosition(
      createPublicPositionBody([first.id]),
    );
    const positionId = creationResponse.body.id as string;
    const version = creationResponse.body.version as number;

    const updateResponse = await request(app)
      .patch(`/api/positions/${positionId}`)
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({
        version,
        description: "Updated description",
        attributeIds: [second.id, first.id],
        tags: ["PostgreSQL"],
      });
    const staleResponse = await request(app)
      .patch(`/api/positions/${positionId}`)
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({
        version,
        description: "Stale description",
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.version).toBe(version + 1);
    expect(
      updateResponse.body.attributes.map(
        ({ id }: { id: string }) => id,
      ),
    ).toEqual([second.id, first.id]);
    expect(updateResponse.body.tags.map(({ name }: { name: string }) => name))
      .toEqual(["PostgreSQL"]);
    expect(staleResponse.status).toBe(409);
    expect(staleResponse.body.error.code).toBe(
      "POSITION_VERSION_CONFLICT",
    );
  });

  it("uses database cascades for joins and CVs", async () => {
    const attribute = await createAttributeFixture("Cascade");
    const creationResponse = await createPosition(
      createPublicPositionBody([attribute.id]),
    );
    const positionId = creationResponse.body.id as string;
    const candidate = await getPrismaClient().candidate.create({
      data: {
        email: "cascade-candidate@example.com",
        passwordHash: "test-only-password-hash",
        profile: { create: {} },
      },
      include: { profile: true },
    });

    await getPrismaClient().cv.create({
      data: {
        positionId,
        profileId: candidate.profile!.id,
      },
    });

    const response = await request(app)
      .delete(`/api/positions/${positionId}`)
      .set("Authorization", `Bearer ${recruiterToken}`);

    expect(response.status).toBe(204);
    await expect(
      getPrismaClient().positionAttribute.count({
        where: { positionId },
      }),
    ).resolves.toBe(0);
    await expect(
      getPrismaClient().positionTag.count({ where: { positionId } }),
    ).resolves.toBe(0);
    await expect(
      getPrismaClient().cv.count({ where: { positionId } }),
    ).resolves.toBe(0);
  });
});

describe("Position listing and Candidate access", () => {
  it("supports stable pagination and prefix search", async () => {
    await getPrismaClient().position.createMany({
      data: [
        { name: "Gamma", description: "Gamma" },
        { name: "Alpha", description: "Alpha" },
        { name: "Alpine", description: "Alpine" },
      ],
    });

    const pageResponse = await request(app)
      .get("/api/positions?page=2&pageSize=1")
      .set("Authorization", `Bearer ${recruiterToken}`);
    const searchResponse = await request(app)
      .get("/api/positions?search=al")
      .set("Authorization", `Bearer ${recruiterToken}`);

    expect(pageResponse.status).toBe(200);
    expect(pageResponse.body.items[0].name).toBe("Alpine");
    expect(pageResponse.body.pagination.total).toBe(3);
    expect(
      searchResponse.body.items.map(({ name }: { name: string }) => name),
    ).toEqual(["Alpha", "Alpine"]);
  });

  it("returns only Positions available to the Candidate", async () => {
    const accessAttribute = await createAttributeFixture(
      "Years of experience",
      "NUMBER",
    );
    const registrationResponse = await request(app)
      .post("/api/auth/candidates/register")
      .send({
        email: "available-candidate@example.com",
        password: "correct-password",
      });
    const candidateToken = registrationResponse.body.token as string;
    const candidate = await getPrismaClient().candidate.findUniqueOrThrow({
      where: { email: "available-candidate@example.com" },
      include: { profile: true },
    });

    await getPrismaClient().profileAttribute.create({
      data: {
        profileId: candidate.profile!.id,
        attributeId: accessAttribute.id,
        value: "5",
      },
    });

    const publicPosition = await createPosition({
      ...createPublicPositionBody([accessAttribute.id]),
      name: "Public",
    });
    const availablePosition = await createPosition({
      ...createPublicPositionBody([accessAttribute.id]),
      name: "Available",
      isPublic: false,
      accessRule: {
        attributeId: accessAttribute.id,
        operator: "GREATER_OR_EQUAL",
        value: "3",
      },
    });
    const unavailablePosition = await createPosition({
      ...createPublicPositionBody([accessAttribute.id]),
      name: "Unavailable",
      isPublic: false,
      accessRule: {
        attributeId: accessAttribute.id,
        operator: "GREATER_THAN",
        value: "10",
      },
    });

    const listResponse = await request(app)
      .get("/api/positions/available")
      .set("Authorization", `Bearer ${candidateToken}`);
    const detailResponse = await request(app)
      .get(`/api/positions/available/${availablePosition.body.id}`)
      .set("Authorization", `Bearer ${candidateToken}`);
    const unavailableDetailResponse = await request(app)
      .get(`/api/positions/available/${unavailablePosition.body.id}`)
      .set("Authorization", `Bearer ${candidateToken}`);

    expect(publicPosition.status).toBe(201);
    expect(listResponse.status).toBe(200);
    expect(
      listResponse.body.items.map(({ name }: { name: string }) => name),
    ).toEqual(["Available", "Public"]);
    expect(detailResponse.status).toBe(200);
    expect(unavailableDetailResponse.status).toBe(404);
  });
});
