import type { Request, Response } from "express";
import { getValidatedRequest } from "../../middleware/validation.middleware.js";
import {
  createAttribute,
  deleteAttribute,
  getAttribute,
  listAttributes,
  updateAttribute,
} from "./attribute.service.js";
import type {
  CreateAttributeRequest,
  DeleteAttributeRequest,
  GetAttributeRequest,
  ListAttributesRequest,
  UpdateAttributeRequest,
} from "./attribute.validation.js";

export async function listAttributeRecords(
  _request: Request,
  response: Response,
): Promise<void> {
  const { query } = getValidatedRequest<ListAttributesRequest>(response);
  response.status(200).json(await listAttributes(query));
}

export async function getAttributeRecord(
  _request: Request,
  response: Response,
): Promise<void> {
  const { params } = getValidatedRequest<GetAttributeRequest>(response);
  response.status(200).json(await getAttribute(params.id));
}

export async function createAttributeRecord(
  _request: Request,
  response: Response,
): Promise<void> {
  const { body } = getValidatedRequest<CreateAttributeRequest>(response);
  response.status(201).json(await createAttribute(body));
}

export async function updateAttributeRecord(
  _request: Request,
  response: Response,
): Promise<void> {
  const { params, body } =
    getValidatedRequest<UpdateAttributeRequest>(response);
  response.status(200).json(await updateAttribute(params.id, body));
}

export async function deleteAttributeRecord(
  _request: Request,
  response: Response,
): Promise<void> {
  const { params } = getValidatedRequest<DeleteAttributeRequest>(response);
  await deleteAttribute(params.id);
  response.status(204).send();
}
