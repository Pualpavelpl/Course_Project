import type { Request, Response } from "express";
import {
  getDatabaseHealthStatus,
  getProcessHealthStatus,
} from "./health.service.js";

export function getProcessHealth(_request: Request, response: Response): void {
  response.status(200).json(getProcessHealthStatus());
}

export async function getDatabaseHealth(
  _request: Request,
  response: Response,
): Promise<void> {
  const databaseHealth = await getDatabaseHealthStatus();

  response.status(databaseHealth.statusCode).json({
    status: databaseHealth.status,
  });
}
