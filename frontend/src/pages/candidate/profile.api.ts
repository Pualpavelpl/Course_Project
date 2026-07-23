import { apiRequest } from "../../shared/api/apiClient";
import type {
  AttributeCategory,
  AttributeOption,
  AttributeType,
} from "../attributes/attributes.api";

export interface ProfileAttribute {
  id: string;
  attributeId: string;
  name: string;
  description: string;
  type: AttributeType;
  category: AttributeCategory;
  isBuiltin: boolean;
  value: string | null;
  optionId: string | null;
  displayValue: string;
  options: AttributeOption[];
  createdAt: string;
  updatedAt: string;
}

export interface CandidateProfile {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  meAttributes: ProfileAttribute[];
  infoAttributes: ProfileAttribute[];
}

export interface AvailableProfileAttribute {
  id: string;
  name: string;
  description: string;
  type: AttributeType;
  category: AttributeCategory;
  options: AttributeOption[];
}

export interface ProfileAttributeValueInput {
  value?: string | undefined;
  optionId?: string | undefined;
}

interface AvailableAttributesInput {
  page: number;
  pageSize: number;
  search?: string | undefined;
  category?: AttributeCategory | undefined;
}

interface AvailableAttributesResponse {
  items: AvailableProfileAttribute[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CandidateProfileTarget {
  candidateId?: string | undefined;
}

function getProfileApiPath(
  target: CandidateProfileTarget = {},
): string {
  return target.candidateId
    ? `/api/admin/candidates/${target.candidateId}/profile`
    : "/api/profile/me";
}

function buildAvailableAttributesQuery(
  input: AvailableAttributesInput,
): string {
  const query = new URLSearchParams({
    page: String(input.page),
    pageSize: String(input.pageSize),
  });

  if (input.search) query.set("search", input.search);
  if (input.category) query.set("category", input.category);
  return query.toString();
}

export function getMyProfile(
  signal?: AbortSignal,
  target: CandidateProfileTarget = {},
): Promise<CandidateProfile> {
  return apiRequest<CandidateProfile>(
    getProfileApiPath(target),
    signal ? { signal } : {},
  );
}

export function listAvailableProfileAttributes(
  input: AvailableAttributesInput,
  signal?: AbortSignal,
  target: CandidateProfileTarget = {},
): Promise<AvailableAttributesResponse> {
  return apiRequest<AvailableAttributesResponse>(
    `${getProfileApiPath(target)}/available-attributes?${buildAvailableAttributesQuery(input)}`,
    signal ? { signal } : {},
  );
}

export function addProfileAttribute(
  version: number,
  attributeId: string,
  input: ProfileAttributeValueInput,
  target: CandidateProfileTarget = {},
): Promise<CandidateProfile> {
  return apiRequest<CandidateProfile>(`${getProfileApiPath(target)}/attributes`, {
    method: "POST",
    body: JSON.stringify({ version, attributeId, ...input }),
  });
}

export function updateProfileAttribute(
  version: number,
  attributeId: string,
  input: ProfileAttributeValueInput,
  target: CandidateProfileTarget = {},
): Promise<CandidateProfile> {
  return apiRequest<CandidateProfile>(
    `${getProfileApiPath(target)}/attributes/${attributeId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ version, ...input }),
    },
  );
}

export function updateProfileAttributes(
  version: number,
  attributes: Array<
    ProfileAttributeValueInput & { attributeId: string }
  >,
  target: CandidateProfileTarget = {},
): Promise<CandidateProfile> {
  return apiRequest<CandidateProfile>(getProfileApiPath(target), {
    method: "PATCH",
    body: JSON.stringify({ version, attributes }),
  });
}

export function deleteProfileAttribute(
  version: number,
  attributeId: string,
  target: CandidateProfileTarget = {},
): Promise<void> {
  return apiRequest<void>(
    `${getProfileApiPath(target)}/attributes/${attributeId}`,
    {
      method: "DELETE",
      body: JSON.stringify({ version }),
    },
  );
}
