import { apiRequest } from "../../shared/api/apiClient";
import type { CandidateProfileTarget } from "./profile.api";

export interface ProjectTag {
  id: string;
  name: string;
}

export interface CandidateProject {
  id: string;
  name: string;
  periodStart: string;
  periodEnd: string | null;
  description: string;
  tags: ProjectTag[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInput {
  name: string;
  periodStart: string;
  periodEnd: string | null;
  description: string;
  tags: string[];
}

function getProjectsApiPath(
  target: CandidateProfileTarget = {},
): string {
  return target.candidateId
    ? `/api/admin/candidates/${target.candidateId}/projects`
    : "/api/profile/me/projects";
}

export function listMyProjects(
  signal?: AbortSignal,
  target: CandidateProfileTarget = {},
): Promise<CandidateProject[]> {
  return apiRequest<CandidateProject[]>(
    getProjectsApiPath(target),
    signal ? { signal } : {},
  );
}

export function getMyProject(
  projectId: string,
  signal?: AbortSignal,
  target: CandidateProfileTarget = {},
): Promise<CandidateProject> {
  return apiRequest<CandidateProject>(
    `${getProjectsApiPath(target)}/${projectId}`,
    signal ? { signal } : {},
  );
}

export function createProject(
  input: ProjectInput,
  target: CandidateProfileTarget = {},
): Promise<CandidateProject> {
  return apiRequest<CandidateProject>(getProjectsApiPath(target), {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProject(
  projectId: string,
  input: Partial<ProjectInput>,
  target: CandidateProfileTarget = {},
): Promise<CandidateProject> {
  return apiRequest<CandidateProject>(
    `${getProjectsApiPath(target)}/${projectId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function deleteProject(
  projectId: string,
  target: CandidateProfileTarget = {},
): Promise<void> {
  return apiRequest<void>(`${getProjectsApiPath(target)}/${projectId}`, {
    method: "DELETE",
  });
}
