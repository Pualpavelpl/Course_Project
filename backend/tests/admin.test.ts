import bcrypt from "bcryptjs";
import { Router } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app, createApp } from "../src/app.js";
import { getPrismaClient } from "../src/lib/prisma.js";
import {
  authenticate,
  requireAdmin,
  requireEmployee,
} from "../src/modules/auth/auth.middleware.js";

const password = "correct-password";

async function createCandidate(email: string) {
  return getPrismaClient().candidate.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 12),
      profile: { create: {} },
    },
    select: {
      id: true,
      email: true,
      profile: { select: { id: true } },
    },
  });
}

async function createEmployee(email: string, isAdmin = false) {
  return getPrismaClient().recruiter.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 12),
      ...(isAdmin ? { admin: { create: {} } } : {}),
    },
    select: {
      id: true,
      email: true,
    },
  });
}

async function loginEmployee(email: string): Promise<string> {
  const response = await request(app)
    .post("/api/auth/recruiters/login")
    .send({ email, password });

  expect(response.status).toBe(200);
  return response.body.token as string;
}

beforeEach(async () => {
  const prisma = getPrismaClient();

  await prisma.$transaction([
    prisma.candidate.deleteMany(),
    prisma.recruiter.deleteMany(),
    prisma.position.deleteMany(),
    prisma.attribute.deleteMany(),
  ]);
});

describe("Admin effective role", () => {
  it("derives RECRUITER or ADMIN from the marker during Employee login", async () => {
    await createEmployee("recruiter@example.com");
    await createEmployee("admin@example.com", true);

    const recruiterResponse = await request(app)
      .post("/api/auth/recruiters/login")
      .send({ email: "recruiter@example.com", password });
    const adminResponse = await request(app)
      .post("/api/auth/recruiters/login")
      .send({ email: "admin@example.com", password });

    expect(recruiterResponse.body.user.role).toBe("RECRUITER");
    expect(adminResponse.body.user.role).toBe("ADMIN");
    expect(JSON.stringify(adminResponse.body).toLowerCase()).not.toContain(
      "password",
    );
  });

  it("refreshes effective role on the next protected request", async () => {
    const recruiter = await createEmployee("promoted@example.com");
    const token = await loginEmployee(recruiter.email);

    await getPrismaClient().admin.create({
      data: { recruiterId: recruiter.id },
    });

    const response = await request(app)
      .get("/api/auth/session")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe("ADMIN");
  });

  it("allows Admin through employee/admin policies and denies Recruiter from Admin", async () => {
    await createEmployee("recruiter@example.com");
    await createEmployee("admin@example.com", true);
    const recruiterToken = await loginEmployee("recruiter@example.com");
    const adminToken = await loginEmployee("admin@example.com");
    const router = Router();

    router.get(
      "/employee",
      authenticate,
      requireEmployee,
      (_request, response) => response.status(200).json({ ok: true }),
    );
    router.get(
      "/admin",
      authenticate,
      requireAdmin,
      (_request, response) => response.status(200).json({ ok: true }),
    );
    const guardedApp = createApp(router);

    expect(
      (
        await request(guardedApp)
          .get("/api/employee")
          .set("Authorization", `Bearer ${adminToken}`)
      ).status,
    ).toBe(200);
    expect(
      (
        await request(guardedApp)
          .get("/api/admin")
          .set("Authorization", `Bearer ${adminToken}`)
      ).status,
    ).toBe(200);
    expect(
      (
        await request(guardedApp)
          .get("/api/admin")
          .set("Authorization", `Bearer ${recruiterToken}`)
      ).status,
    ).toBe(403);
  });

  it("rejects a blocked Admin and cascades its marker on Employee deletion", async () => {
    const admin = await createEmployee("blocked-admin@example.com", true);
    await getPrismaClient().recruiter.update({
      where: { id: admin.id },
      data: { isBlocked: true },
    });

    const loginResponse = await request(app)
      .post("/api/auth/recruiters/login")
      .send({ email: admin.email, password });

    expect(loginResponse.status).toBe(403);
    await getPrismaClient().recruiter.delete({ where: { id: admin.id } });
    expect(
      await getPrismaClient().admin.findUnique({
        where: { recruiterId: admin.id },
      }),
    ).toBeNull();
  });
});

describe("Admin Users API", () => {
  it("lists a paginated projection with search, role/status filters and Profile links", async () => {
    const admin = await createEmployee("admin@example.com", true);
    const candidate = await createCandidate("candidate@example.com");
    await createEmployee("recruiter@example.com");
    const nameAttribute = await getPrismaClient().attribute.create({
      data: {
        name: "Full name",
        description: "Candidate name",
        type: "STRING",
        category: "PERSONAL_INFORMATION",
        isBuiltin: true,
      },
    });
    await getPrismaClient().profileAttribute.create({
      data: {
        profileId: candidate.profile!.id,
        attributeId: nameAttribute.id,
        value: "Anna Candidate",
      },
    });
    const token = await loginEmployee(admin.email);

    const response = await request(app)
      .get("/api/admin/users")
      .query({
        page: 1,
        pageSize: 10,
        search: "Anna",
        role: "CANDIDATE",
        status: "ACTIVE",
      })
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([
      expect.objectContaining({
        id: candidate.id,
        email: candidate.email,
        displayName: "Anna Candidate",
        role: "CANDIDATE",
        status: "ACTIVE",
        profileId: candidate.profile!.id,
      }),
    ]);
    expect(response.body.pagination).toMatchObject({
      page: 1,
      total: 1,
    });
    expect(JSON.stringify(response.body).toLowerCase()).not.toContain(
      "password",
    );
  });

  it("blocks, unblocks and deletes mixed identity references in bulk", async () => {
    const admin = await createEmployee("admin@example.com", true);
    const candidate = await createCandidate("candidate@example.com");
    const recruiter = await createEmployee("recruiter@example.com");
    const token = await loginEmployee(admin.email);
    const references = [
      { id: candidate.id, role: "CANDIDATE" },
      { id: recruiter.id, role: "RECRUITER" },
    ];

    const blockResponse = await request(app)
      .patch("/api/admin/users/block")
      .set("Authorization", `Bearer ${token}`)
      .send(references);
    expect(blockResponse.status).toBe(200);
    expect(blockResponse.body.updated).toBe(2);

    const blocked = await Promise.all([
      getPrismaClient().candidate.findUnique({
        where: { id: candidate.id },
        select: { isBlocked: true },
      }),
      getPrismaClient().recruiter.findUnique({
        where: { id: recruiter.id },
        select: { isBlocked: true },
      }),
    ]);
    expect(blocked.every((record) => record?.isBlocked)).toBe(true);

    expect(
      (
        await request(app)
          .patch("/api/admin/users/unblock")
          .set("Authorization", `Bearer ${token}`)
          .send(references)
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .delete("/api/admin/users")
          .set("Authorization", `Bearer ${token}`)
          .send(references)
      ).status,
    ).toBe(204);
    expect(
      await getPrismaClient().candidate.findUnique({
        where: { id: candidate.id },
      }),
    ).toBeNull();
    expect(
      await getPrismaClient().recruiter.findUnique({
        where: { id: recruiter.id },
      }),
    ).toBeNull();
  });

  it("promotes only Recruiter, preserves credentials and returns 409 on repetition", async () => {
    const admin = await createEmployee("admin@example.com", true);
    const recruiter = await createEmployee("recruiter@example.com");
    const candidate = await createCandidate("candidate@example.com");
    const token = await loginEmployee(admin.email);
    const position = await getPrismaClient().position.create({
      data: {
        name: "Position",
        description: "Position description",
      },
    });
    const cv = await getPrismaClient().cv.create({
      data: {
        profileId: candidate.profile!.id,
        positionId: position.id,
      },
    });
    await getPrismaClient().cvLike.create({
      data: {
        cvId: cv.id,
        recruiterId: recruiter.id,
      },
    });

    const promotion = await request(app)
      .post(`/api/admin/recruiters/${recruiter.id}/promote`)
      .set("Authorization", `Bearer ${token}`);
    const repeated = await request(app)
      .post(`/api/admin/recruiters/${recruiter.id}/promote`)
      .set("Authorization", `Bearer ${token}`);
    const candidatePromotion = await request(app)
      .post(`/api/admin/recruiters/${candidate.id}/promote`)
      .set("Authorization", `Bearer ${token}`);
    const storedRecruiter = await getPrismaClient().recruiter.findUnique({
      where: { id: recruiter.id },
      select: {
        email: true,
        passwordHash: true,
        admin: { select: { recruiterId: true } },
      },
    });

    expect(promotion.status).toBe(201);
    expect(promotion.body.role).toBe("ADMIN");
    expect(repeated.status).toBe(409);
    expect(candidatePromotion.status).toBe(404);
    expect(storedRecruiter).toMatchObject({
      email: recruiter.email,
      passwordHash: expect.any(String),
      admin: { recruiterId: recruiter.id },
    });
    expect(
      await getPrismaClient().cvLike.findUnique({
        where: {
          cvId_recruiterId: {
            cvId: cv.id,
            recruiterId: recruiter.id,
          },
        },
      }),
    ).not.toBeNull();
  });
});

describe("Admin Candidate management", () => {
  it("allows Candidate self-access and Admin target access but rejects Recruiter", async () => {
    const candidate = await createCandidate("candidate@example.com");
    const admin = await createEmployee("admin@example.com", true);
    const recruiter = await createEmployee("recruiter@example.com");
    const candidateLogin = await request(app)
      .post("/api/auth/candidates/login")
      .send({ email: candidate.email, password });
    const adminToken = await loginEmployee(admin.email);
    const recruiterToken = await loginEmployee(recruiter.email);

    expect(
      (
        await request(app)
          .get("/api/profile/me")
          .set("Authorization", `Bearer ${candidateLogin.body.token}`)
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .get(`/api/admin/candidates/${candidate.id}/profile`)
          .set("Authorization", `Bearer ${adminToken}`)
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .get(`/api/admin/candidates/${candidate.id}/profile`)
          .set("Authorization", `Bearer ${recruiterToken}`)
      ).status,
    ).toBe(403);
  });

  it("reuses Profile value validation and lets Admin delete a Candidate CV", async () => {
    const candidate = await createCandidate("candidate@example.com");
    const admin = await createEmployee("admin@example.com", true);
    const token = await loginEmployee(admin.email);
    const attribute = await getPrismaClient().attribute.create({
      data: {
        name: "English level",
        description: "English",
        type: "SINGLE_SELECT",
        category: "DOMAIN_KNOWLEDGE",
        options: {
          create: [{ value: "B2", sortOrder: 0 }],
        },
      },
      include: { options: true },
    });
    const position = await getPrismaClient().position.create({
      data: {
        name: "Developer",
        description: "Developer position",
        positionAttributes: {
          create: { attributeId: attribute.id, sortOrder: 0 },
        },
      },
    });
    const cv = await getPrismaClient().cv.create({
      data: {
        profileId: candidate.profile!.id,
        positionId: position.id,
      },
    });

    const invalidValue = await request(app)
      .post(
        `/api/admin/candidates/${candidate.id}/profile/attributes`,
      )
      .set("Authorization", `Bearer ${token}`)
      .send({
        version: 1,
        attributeId: attribute.id,
        value: "B2",
      });
    const deletion = await request(app)
      .delete(`/api/admin/candidates/${candidate.id}/cvs/${cv.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(invalidValue.status).toBe(400);
    expect(invalidValue.body.error.code).toBe(
      "PROFILE_ATTRIBUTE_VALUE_INVALID",
    );
    expect(deletion.status).toBe(204);
    expect(
      await getPrismaClient().cv.findUnique({ where: { id: cv.id } }),
    ).toBeNull();
  });
});
