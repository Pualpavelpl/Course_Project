import type { Request, Response } from "express";
import { getValidatedRequest } from "../../middleware/validation.middleware.js";
import { listTags } from "./tag.service.js";
import type { ListTagsRequest } from "./tag.validation.js";

export async function listTagRecords(
  _request: Request,
  response: Response,
): Promise<void> {
  const { query } = getValidatedRequest<ListTagsRequest>(response);
  response.status(200).json(await listTags(query));
}
