import type { Request, Response } from "express";
import { getValidatedRequest } from "../../middleware/validation.middleware.js";
import { getTargetCandidateId } from "../auth/candidate-access.middleware.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import {
  addProfileAttribute,
  getMyProfile,
  listAvailableAttributes,
  removeProfileAttribute,
  updateMyProfile,
  updateProfileAttribute,
} from "./profile.service.js";
import type {
  CreateProfileAttributeRequest,
  DeleteProfileAttributeRequest,
  ListAvailableProfileAttributesRequest,
  UpdateMyProfileRequest,
  UpdateProfileAttributeRequest,
} from "./profile.validation.js";

function getCandidateId(request: Request): string {
  return getTargetCandidateId(request as AuthenticatedRequest);
}

export async function getMyProfileRecord(
  request: Request,
  response: Response,
): Promise<void> {
  response.status(200).json(await getMyProfile(getCandidateId(request)));
}

export async function listAvailableProfileAttributeRecords(
  request: Request,
  response: Response,
): Promise<void> {
  const { query } =
    getValidatedRequest<ListAvailableProfileAttributesRequest>(response);
  response.status(200).json(
    await listAvailableAttributes(getCandidateId(request), query),
  );
}

export async function updateMyProfileRecord(
  request: Request,
  response: Response,
): Promise<void> {
  const { body } = getValidatedRequest<UpdateMyProfileRequest>(response);
  response.status(200).json(
    await updateMyProfile(getCandidateId(request), body),
  );
}

export async function createProfileAttributeRecord(
  request: Request,
  response: Response,
): Promise<void> {
  const { body } =
    getValidatedRequest<CreateProfileAttributeRequest>(response);
  response.status(201).json(
    await addProfileAttribute(getCandidateId(request), body),
  );
}

export async function updateProfileAttributeRecord(
  request: Request,
  response: Response,
): Promise<void> {
  const { params, body } =
    getValidatedRequest<UpdateProfileAttributeRequest>(response);
  response.status(200).json(
    await updateProfileAttribute(
      getCandidateId(request),
      params.attributeId,
      body,
    ),
  );
}

export async function deleteProfileAttributeRecord(
  request: Request,
  response: Response,
): Promise<void> {
  const { params, body } =
    getValidatedRequest<DeleteProfileAttributeRequest>(response);
  await removeProfileAttribute(
    getCandidateId(request),
    params.attributeId,
    body.version,
  );
  response.status(204).send();
}
