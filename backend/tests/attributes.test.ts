import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { getPrismaClient } from "../src/lib/prisma.js";

const recruiterCredentials = {
  email: "attribute-recruiter@example.com",
  password: "correct-password",
};

const regularAttribute = {
  name: "Years of experience",
  description: "Candidate professional experience",
  type: "NUMBER",
  category: "DOMAIN_KNOWLEDGE",
} as const;

let recruiterToken: string;

async function createAttributeFixture(
  name: string,
  category:
    | "PERSONAL_INFORMATION"
    | "CERTIFICATION"
    | "DOMAIN_KNOWLEDGE"
    | "SOFT_SKILLS" = "DOMAIN_KNOWLEDGE",
) {
  return getPrismaClient().attribute.create({
    data: {
      name,
      description: `${name} description`,
      type: "STRING",
      category,
    },
  });
}

beforeEach(async () => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Attribute tests require an isolated test database");
  }

  const prisma = getPrismaClient();

  await prisma.$transaction([
    prisma.candidate.deleteMany(),
    prisma.recruiter.deleteMany(),
    prisma.attribute.deleteMany(),
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

describe("GET /api/attributes", () => {
  it("returns a stable paginated list", async () => {
    await Promise.all([
      createAttributeFixture("Gamma"),
      createAttributeFixture("Alpha"),
      createAttributeFixture("Beta"),
    ]);

    const response = await request(app)
      .get("/api/attributes?page=2&pageSize=1")
      .set("Authorization", `Bearer ${recruiterToken}`);

    expect(response.status).toBe(200);
    expect(response.body.items.map(({ name }: { name: string }) => name)).toEqual([
      "Beta",
    ]);
    expect(response.body.pagination).toEqual({
      page: 2,
      pageSize: 1,
      total: 3,
      totalPages: 3,
    });
    expect(response.body.items[0]).not.toHaveProperty("options");
    expect(response.body.items[0]).not.toHaveProperty("version");
  });

  it("performs case-insensitive prefix search by name", async () => {
    await Promise.all([
      createAttributeFixture("English level"),
      createAttributeFixture("Engineering experience"),
      createAttributeFixture("Presentation"),
    ]);

    const response = await request(app)
      .get("/api/attributes?search=eng")
      .set("Authorization", `Bearer ${recruiterToken}`);

    expect(response.status).toBe(200);
    expect(response.body.items.map(({ name }: { name: string }) => name)).toEqual([
      "Engineering experience",
      "English level",
    ]);
  });

  it("filters by category", async () => {
    await Promise.all([
      createAttributeFixture("Certificate", "CERTIFICATION"),
      createAttributeFixture("Location", "PERSONAL_INFORMATION"),
    ]);

    const response = await request(app)
      .get("/api/attributes?category=CERTIFICATION")
      .set("Authorization", `Bearer ${recruiterToken}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].name).toBe("Certificate");
  });
});

describe("Attribute creation", () => {
  it("creates a regular Attribute", async () => {
    const response = await request(app)
      .post("/api/attributes")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send(regularAttribute);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      ...regularAttribute,
      version: 1,
      isBuiltin: false,
      options: [],
    });
  });

  it("creates SINGLE_SELECT options in the requested order", async () => {
    const response = await request(app)
      .post("/api/attributes")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({
        name: "English level",
        description: "Candidate English level",
        type: "SINGLE_SELECT",
        category: "DOMAIN_KNOWLEDGE",
        options: ["A1", "A2", "B1", "B2", "C1", "C2"],
      });

    expect(response.status).toBe(201);
    expect(
      response.body.options.map(
        ({ value, sortOrder }: { value: string; sortOrder: number }) => ({
          value,
          sortOrder,
        }),
      ),
    ).toEqual([
      { value: "A1", sortOrder: 0 },
      { value: "A2", sortOrder: 1 },
      { value: "B1", sortOrder: 2 },
      { value: "B2", sortOrder: 3 },
      { value: "C1", sortOrder: 4 },
      { value: "C2", sortOrder: 5 },
    ]);
  });

  it("rejects duplicate SINGLE_SELECT options after trimming", async () => {
    const response = await request(app)
      .post("/api/attributes")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({
        name: "Duplicate options",
        description: "Invalid select options",
        type: "SINGLE_SELECT",
        category: "SOFT_SKILLS",
        options: ["Advanced", " advanced "],
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("ATTRIBUTE_OPTIONS_DUPLICATE");
  });

  it("rejects options for a non-SINGLE_SELECT Attribute", async () => {
    const response = await request(app)
      .post("/api/attributes")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({
        ...regularAttribute,
        options: ["Not allowed"],
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("ATTRIBUTE_OPTIONS_NOT_ALLOWED");
  });

  it("returns 409 for a duplicate name", async () => {
    await createAttributeFixture(regularAttribute.name);

    const response = await request(app)
      .post("/api/attributes")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send(regularAttribute);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("ATTRIBUTE_NAME_CONFLICT");
  });
});

describe("Attribute update and deletion", () => {
  it("uses version for optimistic locking", async () => {
    const attribute = await createAttributeFixture("Versioned");

    const firstUpdate = await request(app)
      .patch(`/api/attributes/${attribute.id}`)
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({
        version: attribute.version,
        description: "First update",
      });
    const staleUpdate = await request(app)
      .patch(`/api/attributes/${attribute.id}`)
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({
        version: attribute.version,
        description: "Stale update",
      });

    expect(firstUpdate.status).toBe(200);
    expect(firstUpdate.body.version).toBe(attribute.version + 1);
    expect(staleUpdate.status).toBe(409);
    expect(staleUpdate.body.error.code).toBe("ATTRIBUTE_VERSION_CONFLICT");
  });

  it("does not delete a built-in Attribute", async () => {
    const attribute = await getPrismaClient().attribute.create({
      data: {
        name: "Built-in name",
        description: "Required by the Me section",
        type: "STRING",
        category: "PERSONAL_INFORMATION",
        isBuiltin: true,
      },
    });

    const response = await request(app)
      .delete(`/api/attributes/${attribute.id}`)
      .set("Authorization", `Bearer ${recruiterToken}`);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe(
      "BUILTIN_ATTRIBUTE_DELETE_FORBIDDEN",
    );
    await expect(
      getPrismaClient().attribute.findUnique({ where: { id: attribute.id } }),
    ).resolves.not.toBeNull();
  });

  it("does not allow a built-in Attribute structure to change", async () => {
    const attribute = await getPrismaClient().attribute.create({
      data: {
        name: "Protected name",
        description: "Required by the Me section",
        type: "STRING",
        category: "PERSONAL_INFORMATION",
        isBuiltin: true,
      },
    });

    const response = await request(app)
      .patch(`/api/attributes/${attribute.id}`)
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({
        version: attribute.version,
        type: "NUMBER",
      });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe(
      "BUILTIN_ATTRIBUTE_IMMUTABLE",
    );
  });

  it("returns 409 instead of deleting a linked Attribute", async () => {
    const attribute = await createAttributeFixture("Linked");
    const candidate = await getPrismaClient().candidate.create({
      data: {
        email: "linked-candidate@example.com",
        passwordHash: "test-only-password-hash",
        profile: {
          create: {
            profileAttributes: {
              create: {
                attributeId: attribute.id,
                value: "Linked value",
              },
            },
          },
        },
      },
    });

    const response = await request(app)
      .delete(`/api/attributes/${attribute.id}`)
      .set("Authorization", `Bearer ${recruiterToken}`);

    expect(candidate.id).toEqual(expect.any(String));
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("ATTRIBUTE_IN_USE");
  });

  it("deletes an unused non-built-in Attribute", async () => {
    const attribute = await createAttributeFixture("Disposable");

    const response = await request(app)
      .delete(`/api/attributes/${attribute.id}`)
      .set("Authorization", `Bearer ${recruiterToken}`);

    expect(response.status).toBe(204);
    await expect(
      getPrismaClient().attribute.findUnique({ where: { id: attribute.id } }),
    ).resolves.toBeNull();
  });
});
