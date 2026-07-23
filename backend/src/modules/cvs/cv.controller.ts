import type { Request, Response } from "express";
import { getValidatedRequest } from "../../middleware/validation.middleware.js";
import { getTargetCandidateId } from "../auth/candidate-access.middleware.js";
import { getAuthenticatedUser } from "../auth/auth.middleware.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import {
  addCvLike,
  createCv,
  deleteCv,
  getCandidateCv,
  getRecruiterCv,
  listCandidateCvs,
  listRecruiterCvs,
  removeCvLike,
  updateCvProfileAttributes,
} from "./cv.service.js";
import type {
  CreateCvRequest,
  DeleteCvRequest,
  GetCvRequest,
  ListCvsRequest,
  ListRecruiterCvsRequest,
  UpdateCvProfileAttributesRequest,
} from "./cv.validation.js";

function getUserId(request: Request): string {
  return getAuthenticatedUser(request as AuthenticatedRequest).id;
}

function getCandidateId(request: Request): string {
  return getTargetCandidateId(request as AuthenticatedRequest);
}

export async function listCandidateCvRecords(
  request: Request,
  response: Response,
): Promise<void> {
  const { query } = getValidatedRequest<ListCvsRequest>(response);
  response.status(200).json(
    await listCandidateCvs(getCandidateId(request), query),
  );
}

export async function getCandidateCvRecord(
  request: Request,
  response: Response,
): Promise<void> {
  const { params } = getValidatedRequest<GetCvRequest>(response);
  response.status(200).json(
    await getCandidateCv(getCandidateId(request), params.cvId),
  );
}

export async function getRecruiterCvRecord(
  _request: Request,
  response: Response,
): Promise<void> {
  const { params } = getValidatedRequest<GetCvRequest>(response);
  response.status(200).json(await getRecruiterCv(params.cvId));
}

export async function listRecruiterCvRecords(
  request: Request,
  response: Response,
): Promise<void> {
  const { query } =
    getValidatedRequest<ListRecruiterCvsRequest>(response);
  response.status(200).json(
    await listRecruiterCvs(getUserId(request), query),
  );
}

export async function addCvLikeRecord(
  request: Request,
  response: Response,
): Promise<void> {
  const { params } = getValidatedRequest<GetCvRequest>(response);
  response.status(200).json(
    await addCvLike(params.cvId, getUserId(request)),
  );
}

export async function removeCvLikeRecord(
  request: Request,
  response: Response,
): Promise<void> {
  const { params } = getValidatedRequest<GetCvRequest>(response);
  await removeCvLike(params.cvId, getUserId(request));
  response.status(204).send();
}

export async function createCvRecord(
  request: Request,
  response: Response,
): Promise<void> {
  const { body } = getValidatedRequest<CreateCvRequest>(response);
  response.status(201).json(await createCv(getCandidateId(request), body));
}

export async function updateCvProfileAttributeRecords(
  request: Request,
  response: Response,
): Promise<void> {
  const { params, body } =
    getValidatedRequest<UpdateCvProfileAttributesRequest>(response);
  response.status(200).json(
    await updateCvProfileAttributes(
      getCandidateId(request),
      params.cvId,
      body,
    ),
  );
}

export async function deleteCvRecord(
  request: Request,
  response: Response,
): Promise<void> {
  const { params } = getValidatedRequest<DeleteCvRequest>(response);
  await deleteCv(getCandidateId(request), params.cvId);
  response.status(204).send();
}
