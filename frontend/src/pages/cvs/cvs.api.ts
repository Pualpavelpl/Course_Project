import { apiRequest } from "../../shared/api/apiClient";
import type {
  AttributeCategory,
  AttributeOption,
  AttributeType,
} from "../attributes/attributes.api";
import type { ProfileAttributeValueInput } from "../candidate/profile.api";
import type { CandidateProject, ProjectTag } from "../candidate/projects.api";

export interface CandidateCvListItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  position: {
    id: string;
    name: string;
  };
}

export interface CvAttribute {
  id: string;
  attributeId: string;
  name: string;
  description: string;
  type: AttributeType;
  category: AttributeCategory;
  isBuiltin: boolean;
  sortOrder: number;
  value: string | null;
  optionId: string | null;
  displayValue: string;
  options: AttributeOption[];
}

export interface CvDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  profile: {
    id: string;
    version: number;
    candidate: {
      id: string;
      email: string;
    };
  };
  position: {
    id: string;
    name: string;
    description: string;
    maxProjects: number;
  };
  attributes: CvAttribute[];
  projects: CandidateProject[];
  tags: ProjectTag[];
}

interface ListCvsInput {
  page: number;
  pageSize: number;
  search?: string | undefined;
}

interface CandidateCvListResponse {
  items: CandidateCvListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface RecruiterCvListItem {
  id: string;
  position: {
    id: string;
    name: string;
  };
  profile: {
    id: string;
    candidateId: string;
    email: string;
  };
  createdAt: string;
  likeCount: number;
  likedByCurrentRecruiter: boolean;
}

interface ListRecruiterCvsInput extends ListCvsInput {
  positionId?: string | undefined;
  liked?: boolean | undefined;
}

interface RecruiterCvListResponse {
  items: RecruiterCvListItem[];
  pagination: CandidateCvListResponse["pagination"];
}

function buildListQuery(input: ListCvsInput): string {
  const query = new URLSearchParams({
    page: String(input.page),
    pageSize: String(input.pageSize),
  });

  if (input.search) query.set("search", input.search);
  return query.toString();
}

function buildRecruiterListQuery(input: ListRecruiterCvsInput): string {
  const query = new URLSearchParams(buildListQuery(input));

  if (input.positionId) query.set("positionId", input.positionId);
  if (input.liked !== undefined) query.set("liked", String(input.liked));
  return query.toString();
}

function getCandidateCvsApiPath(candidateId?: string): string {
  return candidateId
    ? `/api/admin/candidates/${candidateId}/cvs`
    : "/api/cvs";
}

export function createCv(
  positionId: string,
  candidateId?: string,
): Promise<{
  id: string;
  positionId: string;
  createdAt: string;
  updatedAt: string;
}> {
  return apiRequest(getCandidateCvsApiPath(candidateId), {
    method: "POST",
    body: JSON.stringify({ positionId }),
  });
}

export function listCandidateCvs(
  input: ListCvsInput,
  signal?: AbortSignal,
  candidateId?: string,
): Promise<CandidateCvListResponse> {
  return apiRequest(
    `${getCandidateCvsApiPath(candidateId)}?${buildListQuery(input)}`,
    signal ? { signal } : {},
  );
}

export function getCandidateCv(
  cvId: string,
  signal?: AbortSignal,
  candidateId?: string,
): Promise<CvDetail> {
  return apiRequest(
    `${getCandidateCvsApiPath(candidateId)}/${cvId}`,
    signal ? { signal } : {},
  );
}

export function getRecruiterCv(
  cvId: string,
  signal?: AbortSignal,
): Promise<CvDetail> {
  return apiRequest(
    `/api/cvs/search/${cvId}`,
    signal ? { signal } : {},
  );
}

export function listRecruiterCvs(
  input: ListRecruiterCvsInput,
  signal?: AbortSignal,
): Promise<RecruiterCvListResponse> {
  return apiRequest(
    `/api/cvs/search?${buildRecruiterListQuery(input)}`,
    signal ? { signal } : {},
  );
}

export function likeCv(
  cvId: string,
): Promise<{ liked: true; likeCount: number }> {
  return apiRequest(`/api/cvs/${cvId}/like`, { method: "POST" });
}

export function unlikeCv(cvId: string): Promise<void> {
  return apiRequest(`/api/cvs/${cvId}/like`, { method: "DELETE" });
}

export function saveCvProfileAttributes(
  cvId: string,
  version: number,
  attributes: Array<
    ProfileAttributeValueInput & { attributeId: string }
  >,
  candidateId?: string,
): Promise<CvDetail> {
  return apiRequest(`${getCandidateCvsApiPath(candidateId)}/${cvId}/profile-attributes`, {
    method: "PATCH",
    body: JSON.stringify({ version, attributes }),
  });
}

export function deleteCv(
  cvId: string,
  candidateId?: string,
): Promise<void> {
  return apiRequest(`${getCandidateCvsApiPath(candidateId)}/${cvId}`, {
    method: "DELETE",
  });
}
