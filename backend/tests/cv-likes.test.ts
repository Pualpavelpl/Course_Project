import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { getPrismaClient } from "../src/lib/prisma.js";

let candidateToken: string;
let recruiterToken: string;
let secondRecruiterToken: string;

async function createRecruiter(email: string, password: string) {
  await getPrismaClient().recruiter.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 12),
    },
  });

  return (
    await request(app)
      .post("/api/auth/recruiters/login")
      .send({ email, password })
  ).body.token as string;
}

async function createCvFixture(positionName: string) {
  const position = await getPrismaClient().position.create({
    data: {
      name: positionName,
      description: `${positionName} description`,
    },
  });
  const response = await request(app)
    .post("/api/cvs")
    .set("Authorization", `Bearer ${candidateToken}`)
    .send({ positionId: position.id });

  return {
    cvId: response.body.id as string,
    positionId: position.id,
  };
}

beforeEach(async () => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("CV Like tests require an isolated test database");
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
      .send({
        email: "liked-candidate@example.com",
        password: "correct-password",
      })
  ).body.token as string;
  recruiterToken = await createRecruiter(
    "likes-recruiter@example.com",
    "correct-password",
  );
  secondRecruiterToken = await createRecruiter(
    "likes-second@example.com",
    "correct-password",
  );
});

describe("Recruiter CV Likes", () => {
  it("creates one idempotent Like per Recruiter and aggregates the count", async () => {
    const { cvId } = await createCvFixture("Liked Position");

    const firstResponse = await request(app)
      .post(`/api/cvs/${cvId}/like`)
      .set("Authorization", `Bearer ${recruiterToken}`);
    const repeatedResponse = await request(app)
      .post(`/api/cvs/${cvId}/like`)
      .set("Authorization", `Bearer ${recruiterToken}`);
    const secondRecruiterResponse = await request(app)
      .post(`/api/cvs/${cvId}/like`)
      .set("Authorization", `Bearer ${secondRecruiterToken}`);
    const listResponse = await request(app)
      .get("/api/cvs/search")
      .set("Authorization", `Bearer ${recruiterToken}`);

    expect(firstResponse.body).toEqual({ liked: true, likeCount: 1 });
    expect(repeatedResponse.body).toEqual({ liked: true, likeCount: 1 });
    expect(secondRecruiterResponse.body.likeCount).toBe(2);
    expect(listResponse.body.items[0]).toMatchObject({
      id: cvId,
      likeCount: 2,
      likedByCurrentRecruiter: true,
    });
    await expect(
      getPrismaClient().cvLike.count({ where: { cvId } }),
    ).resolves.toBe(2);
  });

  it("removes only the current Recruiter Like and is idempotent", async () => {
    const { cvId } = await createCvFixture("Unlike Position");
    await request(app)
      .post(`/api/cvs/${cvId}/like`)
      .set("Authorization", `Bearer ${recruiterToken}`);
    await request(app)
      .post(`/api/cvs/${cvId}/like`)
      .set("Authorization", `Bearer ${secondRecruiterToken}`);

    const firstResponse = await request(app)
      .delete(`/api/cvs/${cvId}/like`)
      .set("Authorization", `Bearer ${recruiterToken}`);
    const repeatedResponse = await request(app)
      .delete(`/api/cvs/${cvId}/like`)
      .set("Authorization", `Bearer ${recruiterToken}`);
    const listResponse = await request(app)
      .get("/api/cvs/search")
      .set("Authorization", `Bearer ${recruiterToken}`);

    expect(firstResponse.status).toBe(204);
    expect(repeatedResponse.status).toBe(204);
    expect(listResponse.body.items[0]).toMatchObject({
      likeCount: 1,
      likedByCurrentRecruiter: false,
    });
  });

  it("forbids Candidate Like and Unlike", async () => {
    const { cvId } = await createCvFixture("Candidate Cannot Like");

    const likeResponse = await request(app)
      .post(`/api/cvs/${cvId}/like`)
      .set("Authorization", `Bearer ${candidateToken}`);
    const unlikeResponse = await request(app)
      .delete(`/api/cvs/${cvId}/like`)
      .set("Authorization", `Bearer ${candidateToken}`);

    expect(likeResponse.status).toBe(403);
    expect(unlikeResponse.status).toBe(403);
  });

  it("returns 404 for a missing CV without leaking a database error", async () => {
    const response = await request(app)
      .post("/api/cvs/00000000-0000-4000-8000-000000000000/like")
      .set("Authorization", `Bearer ${recruiterToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("CV_NOT_FOUND");
    expect(response.body).not.toHaveProperty("stack");
  });
});

describe("Recruiter CV search", () => {
  it("supports server pagination, search, Position filter, and liked filter", async () => {
    const alpha = await createCvFixture("Alpha Position");
    const beta = await createCvFixture("Beta Position");
    await request(app)
      .post(`/api/cvs/${alpha.cvId}/like`)
      .set("Authorization", `Bearer ${recruiterToken}`);

    const searchResponse = await request(app)
      .get("/api/cvs/search?search=Al&page=1&pageSize=1")
      .set("Authorization", `Bearer ${recruiterToken}`);
    const positionResponse = await request(app)
      .get(`/api/cvs/search?positionId=${beta.positionId}`)
      .set("Authorization", `Bearer ${recruiterToken}`);
    const likedResponse = await request(app)
      .get("/api/cvs/search?liked=true")
      .set("Authorization", `Bearer ${recruiterToken}`);
    const notLikedResponse = await request(app)
      .get("/api/cvs/search?liked=false")
      .set("Authorization", `Bearer ${recruiterToken}`);

    expect(searchResponse.body.items[0].position.name).toBe("Alpha Position");
    expect(searchResponse.body.pagination.total).toBe(1);
    expect(positionResponse.body.items[0].position.id).toBe(beta.positionId);
    expect(likedResponse.body.items.map(({ id }: { id: string }) => id))
      .toEqual([alpha.cvId]);
    expect(notLikedResponse.body.items.map(({ id }: { id: string }) => id))
      .toEqual([beta.cvId]);
  });

  it("searches Candidate email without selecting password_hash", async () => {
    await createCvFixture("Email Search");

    const response = await request(app)
      .get("/api/cvs/search?search=liked-candidate")
      .set("Authorization", `Bearer ${recruiterToken}`);

    expect(response.status).toBe(200);
    expect(response.body.items[0].profile.email).toBe(
      "liked-candidate@example.com",
    );
    expect(response.body.items[0].profile).not.toHaveProperty("passwordHash");
  });
});
