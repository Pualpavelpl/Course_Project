import { AppError } from "../../shared/errors/app-error.js";
import { normalizeTagNames } from "../tags/tag-name.js";
import {
  createProject as createProjectRecord,
  deleteProject as deleteProjectRecord,
  findProjectByCandidateId,
  findProjectsByCandidateId,
  updateProject as updateProjectRecord,
  type ProjectWriteInput,
} from "./project.repository.js";
import type {
  CreateProjectRequest,
  UpdateProjectRequest,
} from "./project.validation.js";

type ProjectRecord = NonNullable<
  Awaited<ReturnType<typeof findProjectByCandidateId>>
>;

function createProjectNotFoundError(): AppError {
  return new AppError(404, "PROJECT_NOT_FOUND", "Project not found");
}

function mapProject(project: ProjectRecord) {
  return {
    id: project.id,
    name: project.name,
    periodStart: project.periodStart.toISOString().slice(0, 10),
    periodEnd: project.periodEnd?.toISOString().slice(0, 10) ?? null,
    description: project.description,
    tags: project.projectTags.map(({ tag }) => tag),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

function toDatabaseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function validatePeriod(periodStart: string, periodEnd?: string | null): void {
  if (periodEnd && periodEnd < periodStart) {
    throw new AppError(
      400,
      "PROJECT_PERIOD_INVALID",
      "Project period end cannot be before period start",
    );
  }
}

function buildProjectWriteInput(
  body: CreateProjectRequest["body"],
): ProjectWriteInput {
  validatePeriod(body.periodStart, body.periodEnd);

  return {
    name: body.name.trim(),
    periodStart: toDatabaseDate(body.periodStart),
    periodEnd: body.periodEnd ? toDatabaseDate(body.periodEnd) : null,
    description: body.description,
    tagNames: normalizeTagNames(body.tags),
  };
}

export async function listProjects(candidateId: string) {
  return (await findProjectsByCandidateId(candidateId)).map(mapProject);
}

export async function getProject(candidateId: string, projectId: string) {
  const project = await findProjectByCandidateId(candidateId, projectId);

  if (!project) {
    throw createProjectNotFoundError();
  }

  return mapProject(project);
}

export async function createProject(
  candidateId: string,
  body: CreateProjectRequest["body"],
) {
  const result = await createProjectRecord(
    candidateId,
    buildProjectWriteInput(body),
  );

  if (result.status === "profile_not_found") {
    throw new AppError(404, "PROFILE_NOT_FOUND", "Candidate Profile not found");
  }

  return mapProject(result.project);
}

export async function updateProject(
  candidateId: string,
  projectId: string,
  body: UpdateProjectRequest["body"],
) {
  const current = await findProjectByCandidateId(candidateId, projectId);

  if (!current) {
    throw createProjectNotFoundError();
  }

  const input = buildProjectWriteInput({
    name: body.name ?? current.name,
    periodStart:
      body.periodStart ?? current.periodStart.toISOString().slice(0, 10),
    periodEnd:
      body.periodEnd === undefined
        ? current.periodEnd?.toISOString().slice(0, 10) ?? null
        : body.periodEnd,
    description: body.description ?? current.description,
    tags:
      body.tags ?? current.projectTags.map(({ tag }) => tag.name),
  });
  const result = await updateProjectRecord(candidateId, projectId, input);

  if (result.status === "not_found") {
    throw createProjectNotFoundError();
  }

  return mapProject(result.project);
}

export async function deleteProject(
  candidateId: string,
  projectId: string,
): Promise<void> {
  const result = await deleteProjectRecord(candidateId, projectId);

  if (result.status === "not_found") {
    throw createProjectNotFoundError();
  }
}
