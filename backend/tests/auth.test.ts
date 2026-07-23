import bcrypt from "bcryptjs";
import { Router } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app, createApp } from "../src/app.js";
import { getPrismaClient } from "../src/lib/prisma.js";
import {
  authenticate,
  requireRole,
} from "../src/modules/auth/auth.middleware.js";

const candidateCredentials = {
  email: "candidate@example.com",
  password: "correct-password",
};

function expectNoPasswordData(body: unknown): void {
  expect(JSON.stringify(body).toLowerCase()).not.toContain("password");
}

async function registerCandidate() {
  return request(app)
    .post("/api/auth/candidates/register")
    .send(candidateCredentials);
}

async function createRecruiter(
  email = "recruiter@example.com",
  password = "correct-password",
) {
  return getPrismaClient().recruiter.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 12),
    },
    select: {
      id: true,
      email: true,
    },
  });
}

beforeEach(async () => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Authentication tests require an isolated test database");
  }

  const prisma = getPrismaClient();

  await prisma.$transaction([
    prisma.candidate.deleteMany(),
    prisma.recruiter.deleteMany(),
  ]);
});

describe("Candidate registration", () => {
  it("creates a Candidate and its Profile in one request", async () => {
    const response = await request(app)
      .post("/api/auth/candidates/register")
      .send({
        email: "  CANDIDATE@example.com ",
        password: candidateCredentials.password,
      });

    const storedCandidate = await getPrismaClient().candidate.findUnique({
      where: { email: candidateCredentials.email },
      select: {
        profile: {
          select: {
            id: true,
            profileAttributes: {
              select: {
                attribute: {
                  select: { name: true },
                },
              },
              orderBy: { attribute: { name: "asc" } },
            },
          },
        },
      },
    });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      email: candidateCredentials.email,
      role: "CANDIDATE",
    });
    expect(response.body.token).toEqual(expect.any(String));
    expect(storedCandidate?.profile?.id).toEqual(expect.any(String));
    expect(
      storedCandidate?.profile?.profileAttributes.map(
        ({ attribute }) => attribute.name,
      ),
    ).toEqual(["First Name", "Last Name", "Location"]);
    expectNoPasswordData(response.body);
  });

  it("rejects an email already used by either role", async () => {
    await createRecruiter(candidateCredentials.email);

    const response = await registerCandidate();

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: {
        code: "EMAIL_CONFLICT",
        message: "Email is already registered",
      },
    });
  });

  it("returns 400 for invalid or unknown registration values", async () => {
    const response = await request(app)
      .post("/api/auth/candidates/register")
      .send({
        email: "not-an-email",
        password: "short",
        role: "ADMIN",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("Candidate and Recruiter login", () => {
  it("logs in a Candidate without exposing the password hash", async () => {
    await registerCandidate();

    const response = await request(app)
      .post("/api/auth/candidates/login")
      .send(candidateCredentials);

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      email: candidateCredentials.email,
      role: "CANDIDATE",
    });
    expect(response.body.token).toEqual(expect.any(String));
    expectNoPasswordData(response.body);
  });

  it("logs in a Recruiter without exposing the password hash", async () => {
    await createRecruiter();

    const response = await request(app)
      .post("/api/auth/recruiters/login")
      .send({
        email: "recruiter@example.com",
        password: "correct-password",
      });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      email: "recruiter@example.com",
      role: "RECRUITER",
    });
    expect(response.body.token).toEqual(expect.any(String));
    expectNoPasswordData(response.body);
  });

  it("returns the same 401 error for a wrong password and unknown email", async () => {
    await registerCandidate();

    const wrongPasswordResponse = await request(app)
      .post("/api/auth/candidates/login")
      .send({
        email: candidateCredentials.email,
        password: "wrong-password",
      });
    const unknownEmailResponse = await request(app)
      .post("/api/auth/candidates/login")
      .send({
        email: "unknown@example.com",
        password: "wrong-password",
      });

    expect(wrongPasswordResponse.status).toBe(401);
    expect(unknownEmailResponse.status).toBe(401);
    expect(wrongPasswordResponse.body).toEqual(unknownEmailResponse.body);
  });

  it("rejects a blocked account", async () => {
    await registerCandidate();
    await getPrismaClient().candidate.update({
      where: { email: candidateCredentials.email },
      data: { isBlocked: true },
    });

    const response = await request(app)
      .post("/api/auth/candidates/login")
      .send(candidateCredentials);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("ACCOUNT_BLOCKED");
  });
});

describe("Authenticated session", () => {
  it("returns the current user and rechecks the account on every request", async () => {
    const registrationResponse = await registerCandidate();
    const token = registrationResponse.body.token as string;

    const activeResponse = await request(app)
      .get("/api/auth/session")
      .set("Authorization", `Bearer ${token}`);

    expect(activeResponse.status).toBe(200);
    expect(activeResponse.body.user).toMatchObject({
      email: candidateCredentials.email,
      role: "CANDIDATE",
    });
    expectNoPasswordData(activeResponse.body);

    await getPrismaClient().candidate.update({
      where: { email: candidateCredentials.email },
      data: { isBlocked: true },
    });

    const blockedResponse = await request(app)
      .get("/api/auth/session")
      .set("Authorization", `Bearer ${token}`);

    expect(blockedResponse.status).toBe(401);
    expect(blockedResponse.body.error.code).toBe("INVALID_SESSION");
  });

  it("does not allow a Candidate through a Recruiter role guard", async () => {
    const registrationResponse = await registerCandidate();
    const token = registrationResponse.body.token as string;
    const protectedRouter = Router();

    protectedRouter.get(
      "/recruiter-only",
      authenticate,
      requireRole("RECRUITER"),
      (_request, response) => {
        response.status(200).json({ status: "ok" });
      },
    );

    const response = await request(createApp(protectedRouter))
      .get("/api/recruiter-only")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("INSUFFICIENT_ROLE");
  });
});
