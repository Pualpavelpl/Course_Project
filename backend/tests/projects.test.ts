import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { getPrismaClient } from "../src/lib/prisma.js";

const firstCandidate = {
  email: "project-owner@example.com",
  password: "correct-password",
};
const secondCandidate = {
  email: "project-other@example.com",
  password: "correct-password",
};

let firstToken: string;
let secondToken: string;
let recruiterToken: string;

const projectBody = {
  name: "Course Project",
  periodStart: "2026-01-01",
  periodEnd: "2026-06-30",
  description: "## Work\n\nBuilt with **TypeScript**.",
  tags: ["React", "TypeScript", " react "],
};

async function registerCandidate(credentials: typeof firstCandidate) {
  return request(app)
    .post("/api/auth/candidates/register")
    .send(credentials);
}

async function createProject(token: string, body: object = projectBody) {
  return request(app)
    .post("/api/profile/me/projects")
    .set("Authorization", `Bearer ${token}`)
    .send(body);
}

beforeEach(async () => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Project tests require an isolated test database");
  }

  const prisma = getPrismaClient();
  await prisma.$transaction([
    prisma.candidate.deleteMany(),
    prisma.position.deleteMany(),
    prisma.recruiter.deleteMany(),
    prisma.attribute.deleteMany(),
    prisma.tag.deleteMany(),
  ]);

  firstToken = (await registerCandidate(firstCandidate)).body.token as string;
  secondToken = (await registerCandidate(secondCandidate)).body.token as string;

  const recruiterPassword = "recruiter-password";
  await prisma.recruiter.create({
    data: {
      email: "project-recruiter@example.com",
      passwordHash: await bcrypt.hash(recruiterPassword, 12),
    },
  });
  recruiterToken = (
    await request(app)
      .post("/api/auth/recruiters/login")
      .send({
        email: "project-recruiter@example.com",
        password: recruiterPassword,
      })
  ).body.token as string;
});

describe("Candidate Projects", () => {
  it("creates a Project and normalized shared Tags in one use case", async () => {
    await getPrismaClient().tag.create({ data: { name: "React" } });

    const response = await createProject(firstToken);
    const tags = await getPrismaClient().tag.findMany({
      orderBy: { name: "asc" },
    });
    const joins = await getPrismaClient().projectTag.findMany({
      where: { projectId: response.body.id as string },
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: projectBody.name,
      periodStart: projectBody.periodStart,
      periodEnd: projectBody.periodEnd,
      description: projectBody.description,
    });
    expect(response.body.tags.map(({ name }: { name: string }) => name))
      .toEqual(["React", "TypeScript"]);
    expect(tags).toHaveLength(2);
    expect(joins).toHaveLength(2);
  });

  it("rejects an end date before the start date", async () => {
    const response = await createProject(firstToken, {
      ...projectBody,
      periodEnd: "2025-12-31",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("PROJECT_PERIOD_INVALID");
  });

  it("lists only the authenticated Candidate Projects", async () => {
    await createProject(firstToken);
    await createProject(secondToken, {
      ...projectBody,
      name: "Other Project",
    });

    const firstList = await request(app)
      .get("/api/profile/me/projects")
      .set("Authorization", `Bearer ${firstToken}`);
    const recruiterList = await request(app)
      .get("/api/profile/me/projects")
      .set("Authorization", `Bearer ${recruiterToken}`);

    expect(firstList.status).toBe(200);
    expect(firstList.body).toHaveLength(1);
    expect(firstList.body[0].name).toBe(projectBody.name);
    expect(recruiterList.status).toBe(403);
  });

  it("does not expose another Candidate Project", async () => {
    const creationResponse = await createProject(firstToken);
    const projectId = creationResponse.body.id as string;

    const detailResponse = await request(app)
      .get(`/api/profile/me/projects/${projectId}`)
      .set("Authorization", `Bearer ${secondToken}`);
    const updateResponse = await request(app)
      .patch(`/api/profile/me/projects/${projectId}`)
      .set("Authorization", `Bearer ${secondToken}`)
      .send({ name: "Taken over" });
    const deleteResponse = await request(app)
      .delete(`/api/profile/me/projects/${projectId}`)
      .set("Authorization", `Bearer ${secondToken}`);

    expect(detailResponse.status).toBe(404);
    expect(updateResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
  });

  it("updates scalar fields and Project Tags together", async () => {
    const creationResponse = await createProject(firstToken);
    const projectId = creationResponse.body.id as string;

    const response = await request(app)
      .patch(`/api/profile/me/projects/${projectId}`)
      .set("Authorization", `Bearer ${firstToken}`)
      .send({
        name: "Updated Project",
        periodEnd: null,
        tags: ["PostgreSQL"],
      });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Updated Project");
    expect(response.body.periodEnd).toBeNull();
    expect(response.body.tags).toEqual([
      expect.objectContaining({ name: "PostgreSQL" }),
    ]);
  });

  it("deletes the owned Project and cascades its Tag joins", async () => {
    const creationResponse = await createProject(firstToken);
    const projectId = creationResponse.body.id as string;

    const response = await request(app)
      .delete(`/api/profile/me/projects/${projectId}`)
      .set("Authorization", `Bearer ${firstToken}`);

    expect(response.status).toBe(204);
    await expect(
      getPrismaClient().projectTag.count({ where: { projectId } }),
    ).resolves.toBe(0);
    await expect(
      getPrismaClient().project.count({ where: { id: projectId } }),
    ).resolves.toBe(0);
  });
});
