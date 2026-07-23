import type { Request, Response } from "express";
import { getValidatedRequest } from "../../middleware/validation.middleware.js";
import { getTargetCandidateId } from "../auth/candidate-access.middleware.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from "./project.service.js";
import type {
  CreateProjectRequest,
  DeleteProjectRequest,
  GetProjectRequest,
  UpdateProjectRequest,
} from "./project.validation.js";

function getCandidateId(request: Request): string {
  return getTargetCandidateId(request as AuthenticatedRequest);
}

export async function listProjectRecords(
  request: Request,
  response: Response,
): Promise<void> {
  response.status(200).json(await listProjects(getCandidateId(request)));
}

export async function getProjectRecord(
  request: Request,
  response: Response,
): Promise<void> {
  const { params } = getValidatedRequest<GetProjectRequest>(response);
  response.status(200).json(
    await getProject(getCandidateId(request), params.projectId),
  );
}

export async function createProjectRecord(
  request: Request,
  response: Response,
): Promise<void> {
  const { body } = getValidatedRequest<CreateProjectRequest>(response);
  response.status(201).json(
    await createProject(getCandidateId(request), body),
  );
}

export async function updateProjectRecord(
  request: Request,
  response: Response,
): Promise<void> {
  const { params, body } =
    getValidatedRequest<UpdateProjectRequest>(response);
  response.status(200).json(
    await updateProject(getCandidateId(request), params.projectId, body),
  );
}

export async function deleteProjectRecord(
  request: Request,
  response: Response,
): Promise<void> {
  const { params } =
    getValidatedRequest<DeleteProjectRequest>(response);
  await deleteProject(getCandidateId(request), params.projectId);
  response.status(204).send();
}
