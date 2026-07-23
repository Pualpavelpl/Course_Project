import { verifyDatabaseConnection } from "./health.repository.js";

export function getProcessHealthStatus() {
  return {
    status: "ok" as const,
  };
}

export async function getDatabaseHealthStatus() {
  try {
    await verifyDatabaseConnection();

    return {
      status: "connected" as const,
      statusCode: 200 as const,
    };
  } catch {
    return {
      status: "unavailable" as const,
      statusCode: 503 as const,
    };
  }
}
