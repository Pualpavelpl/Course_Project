import type { Request, Response } from "express";
import { getValidatedRequest } from "../../middleware/validation.middleware.js";
import {
  changeUsersBlockedStatus,
  createRecruiter,
  deleteAdminUsers,
  listAdminUsers,
  promoteRecruiterToAdmin,
} from "./admin-user.service.js";
import type {
  CreateRecruiterRequest,
  ListAdminUsersRequest,
  MutateAdminUsersRequest,
  PromoteRecruiterRequest,
} from "./admin-user.validation.js";

export async function createRecruiterRecord(
  _request: Request,
  response: Response,
): Promise<void> {
  const { body } =
    getValidatedRequest<CreateRecruiterRequest>(response);
  response.status(201).json(await createRecruiter(body));
}

export async function listAdminUserRecords(
  _request: Request,
  response: Response,
): Promise<void> {
  const { query } =
    getValidatedRequest<ListAdminUsersRequest>(response);
  response.status(200).json(await listAdminUsers(query));
}

export async function blockAdminUserRecords(
  _request: Request,
  response: Response,
): Promise<void> {
  const { body } =
    getValidatedRequest<MutateAdminUsersRequest>(response);
  response
    .status(200)
    .json(await changeUsersBlockedStatus(body, true));
}

export async function unblockAdminUserRecords(
  _request: Request,
  response: Response,
): Promise<void> {
  const { body } =
    getValidatedRequest<MutateAdminUsersRequest>(response);
  response
    .status(200)
    .json(await changeUsersBlockedStatus(body, false));
}

export async function deleteAdminUserRecords(
  _request: Request,
  response: Response,
): Promise<void> {
  const { body } =
    getValidatedRequest<MutateAdminUsersRequest>(response);
  await deleteAdminUsers(body);
  response.status(204).send();
}

export async function promoteRecruiterRecord(
  _request: Request,
  response: Response,
): Promise<void> {
  const { params } =
    getValidatedRequest<PromoteRecruiterRequest>(response);
  response
    .status(201)
    .json(await promoteRecruiterToAdmin(params.recruiterId));
}
