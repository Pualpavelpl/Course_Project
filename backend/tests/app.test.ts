import { Router } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app, createApp } from "../src/app.js";
import { parseEnvironment } from "../src/config/env.js";

describe("HTTP application", () => {
  it("returns process health without a database connection", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
    });
  });

  it("supports multiple configured frontend origins", async () => {
    const parsedEnvironment = parseEnvironment({
      ...process.env,
      FRONTEND_URL:
        "https://production.example, https://course-project-*-pavel30.vercel.app",
    });

    expect(parsedEnvironment.FRONTEND_URL).toEqual([
      "https://production.example",
      "https://course-project-*-pavel30.vercel.app",
    ]);
  });

  it("allows preflight from a matching Vercel preview origin", async () => {
    const previewApplication = createApp(
      Router(),
      [
        "https://course-project-gold-nine.vercel.app",
        "https://course-project-*-pavel30.vercel.app",
      ],
    );
    const previewOrigin =
      "https://course-project-86ttdvgh1-pavel30.vercel.app";
    const response = await request(previewApplication)
      .options("/api/auth/recruiters/login")
      .set("Origin", previewOrigin)
      .set("Access-Control-Request-Method", "POST");

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      previewOrigin,
    );
  });

  it("rejects preflight from another Vercel account", async () => {
    const previewApplication = createApp(
      Router(),
      ["https://course-project-*-pavel30.vercel.app"],
    );
    const response = await request(previewApplication)
      .options("/api/auth/recruiters/login")
      .set(
        "Origin",
        "https://course-project-preview-another-account.vercel.app",
      )
      .set("Access-Control-Request-Method", "POST");

    expect(
      response.headers["access-control-allow-origin"],
    ).toBeUndefined();
  });

  it("allows preflight from the configured frontend origin", async () => {
    const response = await request(app)
      .options("/api/auth/recruiters/login")
      .set("Origin", "https://frontend.example")
      .set("Access-Control-Request-Method", "POST");

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "https://frontend.example",
    );
  });

  it("returns a centralized 404 response for an unknown endpoint", async () => {
    const response = await request(app).get("/api/unknown");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "ROUTE_NOT_FOUND",
        message: "Route not found",
      },
    });
  });

  it("returns 400 for unknown request values", async () => {
    const response = await request(app).get(
      "/api/health?unexpected=value",
    );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request",
      },
    });
  });

  it("does not expose internal errors or stack traces", async () => {
    const failingRouter = Router();
    failingRouter.get("/failure", () => {
      throw new Error("sensitive internal test error");
    });

    const response = await request(createApp(failingRouter)).get(
      "/api/failure",
    );
    const serializedBody = JSON.stringify(response.body);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    });
    expect(serializedBody).not.toContain("stack");
    expect(serializedBody).not.toContain("sensitive internal test error");
  });
});
