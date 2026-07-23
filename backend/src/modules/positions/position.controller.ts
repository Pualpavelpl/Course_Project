import type { Request, Response } from "express";
import { getValidatedRequest } from "../../middleware/validation.middleware.js";
import { getAuthenticatedUser } from "../auth/auth.middleware.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import {
  getAvailablePosition,
  listAvailablePositions,
} from "./candidate-position.service.js";
import {
  createPosition,
  deletePosition,
  getPosition,
  listPositions,
  updatePosition,
} from "./position.service.js";
import type {
  CreatePositionRequest,
  DeletePositionRequest,
  GetPositionRequest,
  ListPositionsRequest,
  UpdatePositionRequest,
} from "./position.validation.js";

export async function listPositionRecords(
  _request: Request,
  response: Response,
): Promise<void> {
  const { query } = getValidatedRequest<ListPositionsRequest>(response);
  response.status(200).json(await listPositions(query));
}

export async function listAvailablePositionRecords(
  request: Request,
  response: Response,
): Promise<void> {
  const user = getAuthenticatedUser(request as AuthenticatedRequest);
  const { query } = getValidatedRequest<ListPositionsRequest>(response);
  response.status(200).json(await listAvailablePositions(user.id, query));
}

export async function getPositionRecord(
  _request: Request,
  response: Response,
): Promise<void> {
  const { params } = getValidatedRequest<GetPositionRequest>(response);
  response.status(200).json(await getPosition(params.id));
}

export async function getAvailablePositionRecord(
  request: Request,
  response: Response,
): Promise<void> {
  const user = getAuthenticatedUser(request as AuthenticatedRequest);
  const { params } = getValidatedRequest<GetPositionRequest>(response);
  response.status(200).json(
    await getAvailablePosition(user.id, params.id),
  );
}

export async function createPositionRecord(
  _request: Request,
  response: Response,
): Promise<void> {
  const { body } = getValidatedRequest<CreatePositionRequest>(response);
  response.status(201).json(await createPosition(body));
}

export async function updatePositionRecord(
  _request: Request,
  response: Response,
): Promise<void> {
  const { params, body } =
    getValidatedRequest<UpdatePositionRequest>(response);
  response.status(200).json(await updatePosition(params.id, body));
}

export async function deletePositionRecord(
  _request: Request,
  response: Response,
): Promise<void> {
  const { params } = getValidatedRequest<DeletePositionRequest>(response);
  await deletePosition(params.id);
  response.status(204).send();
}
