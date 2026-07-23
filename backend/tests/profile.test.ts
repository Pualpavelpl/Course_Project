import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { getPrismaClient } from "../src/lib/prisma.js";
import { validateAttributeValue } from "../src/modules/attributes/attribute-value.js";

const candidateCredentials = {
  email: "profile-candidate@example.com",
  password: "correct-password",
};

let candidateToken: string;
let recruiterToken: string;

async function createAttribute(
  name: string,
  type:
    | "STRING"
    | "NUMBER"
    | "DATE"
    | "PERIOD"
    | "BOOLEAN"
    | "SINGLE_SELECT",
  isBuiltin = false,
) {
  return getPrismaClient().attribute.create({
    data: {
      name,
      description: `${name} description`,
      type,
      category: isBuiltin
        ? "PERSONAL_INFORMATION"
        : "DOMAIN_KNOWLEDGE",
      isBuiltin,
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
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });
}

async function getProfile() {
  return request(app)
    .get("/api/profile/me")
    .set("Authorization", `Bearer ${candidateToken}`);
}

beforeEach(async () => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Profile tests require an isolated test database");
  }

  const prisma = getPrismaClient();
  await prisma.$transaction([
    prisma.candidate.deleteMany(),
    prisma.position.deleteMany(),
    prisma.recruiter.deleteMany(),
    prisma.attribute.deleteMany(),
    prisma.tag.deleteMany(),
  ]);

  const registrationResponse = await request(app)
    .post("/api/auth/candidates/register")
    .send(candidateCredentials);
  candidateToken = registrationResponse.body.token as string;

  const recruiterPassword = "recruiter-password";
  await prisma.recruiter.create({
    data: {
      email: "profile-recruiter@example.com",
      passwordHash: await bcrypt.hash(recruiterPassword, 12),
    },
  });
  const recruiterLogin = await request(app)
    .post("/api/auth/recruiters/login")
    .send({
      email: "profile-recruiter@example.com",
      password: recruiterPassword,
    });
  recruiterToken = recruiterLogin.body.token as string;
});

describe("Attribute value validation", () => {
  it.each([
    ["STRING", { value: "  TypeScript  " }, "TypeScript"],
    ["NUMBER", { value: " 05.50 " }, "5.5"],
    ["DATE", { value: "2026-07-23" }, "2026-07-23"],
    [
      "PERIOD",
      { value: "2025-01-01/2026-01-01" },
      "2025-01-01/2026-01-01",
    ],
    ["BOOLEAN", { value: "TRUE" }, "true"],
  ] as const)(
    "normalizes %s values",
    (type, input, expectedValue) => {
      const result = validateAttributeValue(
        { type, options: [] },
        input,
      );

      expect(result).toEqual({
        valid: true,
        value: { value: expectedValue, optionId: null },
      });
    },
  );

  it("validates SINGLE_SELECT option ownership", () => {
    const validResult = validateAttributeValue(
      { type: "SINGLE_SELECT", options: [{ id: "allowed" }] },
      { optionId: "allowed" },
    );
    const invalidResult = validateAttributeValue(
      { type: "SINGLE_SELECT", options: [{ id: "allowed" }] },
      { optionId: "other" },
    );

    expect(validResult).toEqual({
      valid: true,
      value: { value: null, optionId: "allowed" },
    });
    expect(invalidResult.valid).toBe(false);
  });

  it.each([
    ["NUMBER", "not-a-number"],
    ["DATE", "2026-02-30"],
    ["PERIOD", "2026-02-01/2026-01-01"],
    ["BOOLEAN", "yes"],
  ] as const)("rejects invalid %s values", (type, value) => {
    expect(
      validateAttributeValue({ type, options: [] }, { value }).valid,
    ).toBe(false);
  });
});

describe("Candidate Profile API", () => {
  it("returns only the authenticated Candidate Profile", async () => {
    const response = await getProfile();
    const recruiterResponse = await request(app)
      .get("/api/profile/me")
      .set("Authorization", `Bearer ${recruiterToken}`);

    expect(response.status).toBe(200);
    expect(response.body.version).toBe(1);
    expect(
      response.body.meAttributes.map(
        ({ name }: { name: string }) => name,
      ),
    ).toEqual(["First Name", "Last Name", "Location"]);
    expect(response.body.infoAttributes).toEqual([]);
    expect(recruiterResponse.status).toBe(403);
  });

  it("adds and updates one normalized Profile Attribute", async () => {
    const attribute = await createAttribute("Years", "NUMBER");
    const creationResponse = await request(app)
      .post("/api/profile/me/attributes")
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({
        version: 1,
        attributeId: attribute.id,
        value: " 05.50 ",
      });
    const updateResponse = await request(app)
      .patch(`/api/profile/me/attributes/${attribute.id}`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({ version: 2, value: "6" });

    expect(creationResponse.status).toBe(201);
    expect(creationResponse.body.version).toBe(2);
    expect(creationResponse.body.infoAttributes[0].value).toBe("5.5");
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.version).toBe(3);
    expect(updateResponse.body.infoAttributes[0].value).toBe("6");
  });

  it("rejects duplicate values, invalid values, and stale versions", async () => {
    const attribute = await createAttribute("Boolean flag", "BOOLEAN");
    const creationResponse = await request(app)
      .post("/api/profile/me/attributes")
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({
        version: 1,
        attributeId: attribute.id,
        value: "true",
      });
    const duplicateResponse = await request(app)
      .post("/api/profile/me/attributes")
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({
        version: 2,
        attributeId: attribute.id,
        value: "false",
      });
    const invalidResponse = await request(app)
      .patch(`/api/profile/me/attributes/${attribute.id}`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({ version: 2, value: "yes" });
    const staleResponse = await request(app)
      .patch(`/api/profile/me/attributes/${attribute.id}`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({ version: 1, value: "false" });

    expect(creationResponse.status).toBe(201);
    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.error.code).toBe(
      "PROFILE_ATTRIBUTE_CONFLICT",
    );
    expect(invalidResponse.status).toBe(400);
    expect(staleResponse.status).toBe(409);
    expect(staleResponse.body.error.code).toBe(
      "PROFILE_VERSION_CONFLICT",
    );
  });

  it("validates SINGLE_SELECT option ownership", async () => {
    const first = await createAttribute("Level", "SINGLE_SELECT");
    const second = await createAttribute("Language", "SINGLE_SELECT");

    const response = await request(app)
      .post("/api/profile/me/attributes")
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({
        version: 1,
        attributeId: first.id,
        optionId: second.options[0]?.id,
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe(
      "PROFILE_ATTRIBUTE_VALUE_INVALID",
    );
  });

  it("batch-updates values with one Profile version change", async () => {
    const first = await getPrismaClient().attribute.findUniqueOrThrow({
      where: { name: "First Name" },
    });
    const second = await createAttribute("Certified", "BOOLEAN");

    const response = await request(app)
      .patch("/api/profile/me")
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({
        version: 1,
        attributes: [
          { attributeId: first.id, value: "Ada" },
          { attributeId: second.id, value: "true" },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.version).toBe(2);
    expect(response.body.meAttributes).toHaveLength(3);
    expect(response.body.infoAttributes).toHaveLength(1);
  });

  it("does not delete built-in values and deletes Info values", async () => {
    const builtin = await getPrismaClient().attribute.findUniqueOrThrow({
      where: { name: "First Name" },
    });
    const info = await createAttribute("Skill", "STRING");
    await request(app)
      .patch("/api/profile/me")
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({
        version: 1,
        attributes: [
          { attributeId: builtin.id, value: "Ada" },
          { attributeId: info.id, value: "TypeScript" },
        ],
      });

    const builtinDelete = await request(app)
      .delete(`/api/profile/me/attributes/${builtin.id}`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({ version: 2 });
    const infoDelete = await request(app)
      .delete(`/api/profile/me/attributes/${info.id}`)
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({ version: 2 });

    expect(builtinDelete.status).toBe(409);
    expect(infoDelete.status).toBe(204);
    expect((await getProfile()).body.infoAttributes).toEqual([]);
  });

  it("lists only unused non-built-in Attributes", async () => {
    const used = await createAttribute("Used", "STRING");
    await createAttribute("Available", "STRING");
    await createAttribute("Built-in", "STRING", true);
    await request(app)
      .post("/api/profile/me/attributes")
      .set("Authorization", `Bearer ${candidateToken}`)
      .send({
        version: 1,
        attributeId: used.id,
        value: "value",
      });

    const response = await request(app)
      .get("/api/profile/me/available-attributes?search=Av")
      .set("Authorization", `Bearer ${candidateToken}`);

    expect(response.status).toBe(200);
    expect(response.body.items.map(({ name }: { name: string }) => name))
      .toEqual(["Available"]);
  });
});
