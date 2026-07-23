import { readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { afterAll } from "vitest";

const database = await PGlite.create();
const migrationsDirectory = new URL("../prisma/migrations/", import.meta.url);
const migrationDirectories = (await readdir(migrationsDirectory, {
  withFileTypes: true,
  }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .toSorted();
const migrationSql = await Promise.all(
  migrationDirectories.map((directory) =>
    readFile(
      new URL(`${directory}/migration.sql`, migrationsDirectory),
      "utf8",
    ),
  ),
);

await database.exec(migrationSql.join("\n"));

const databaseServer = new PGLiteSocketServer({
  db: database,
  port: 0,
  maxConnections: 10,
});

await databaseServer.start();

process.env.NODE_ENV = "test";
process.env.PORT = "5001";
process.env.DATABASE_URL =
  `postgresql://postgres:postgres@${databaseServer.getServerConn()}/postgres`;
process.env.PGSSLMODE = "disable";
process.env.FRONTEND_URL = "https://frontend.example";
process.env.JWT_SECRET = "test-only-secret-that-is-longer-than-32-characters";
process.env.JWT_EXPIRES_IN = "15m";

afterAll(async () => {
  const { disconnectPrisma } = await import("../src/lib/prisma.js");

  await disconnectPrisma();
  await databaseServer.stop();
  await database.close();
});
