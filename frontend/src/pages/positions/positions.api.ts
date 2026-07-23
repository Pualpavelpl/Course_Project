import { apiRequest } from "../../shared/api/apiClient";
import type {
  AttributeCategory,
  AttributeType,
} from "../attributes/attributes.api";

export const accessOperators = [
  "EQUALS",
  "NOT_EQUALS",
  "GREATER_THAN",
  "GREATER_OR_EQUAL",
  "LESS_THAN",
  "LESS_OR_EQUAL",
  "CONTAINS",
] as const;

export type AccessOperator = (typeof accessOperators)[number];

export const accessOperatorLabels: Record<AccessOperator, string> = {
  EQUALS: "Equals",
  NOT_EQUALS: "Does not equal",
  GREATER_THAN: "Greater than",
  GREATER_OR_EQUAL: "Greater than or equal",
  LESS_THAN: "Less than",
  LESS_OR_EQUAL: "Less than or equal",
  CONTAINS: "Contains",
};

const equalityOperators = ["EQUALS", "NOT_EQUALS"] as const;

export function getAllowedOperators(
  attributeType: AttributeType,
): readonly AccessOperator[] {
  if (attributeType === "STRING") {
    return [...equalityOperators, "CONTAINS"];
  }

  if (attributeType === "NUMBER" || attributeType === "DATE") {
    return [
      ...equalityOperators,
      "GREATER_THAN",
      "GREATER_OR_EQUAL",
      "LESS_THAN",
      "LESS_OR_EQUAL",
    ];
  }

  return equalityOperators;
}

export interface PaginatedResponse<Item> {
  items: Item[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface PositionListItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidatePositionListItem {
  id: string;
  name: string;
}

export interface PositionAttribute {
  id: string;
  name: string;
  description: string;
  type: AttributeType;
  category: AttributeCategory;
  sortOrder: number;
}

export interface PositionTag {
  id: string;
  name: string;
}

interface PositionAccessRule {
  attribute: {
    id: string;
    name: string;
    type: AttributeType;
  };
  operator: AccessOperator;
  option: {
    id: string;
    value: string;
  } | null;
  value: string | null;
}

export interface CandidatePositionDetail {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  maxProjects: number;
  createdAt: string;
  updatedAt: string;
  attributes: PositionAttribute[];
  tags: PositionTag[];
  accessRule: PositionAccessRule | null;
}

export interface RecruiterPositionDetail extends CandidatePositionDetail {
  version: number;
}

export interface PositionInput {
  name: string;
  description: string;
  maxProjects: number;
  attributeIds: string[];
  tags: string[];
  isPublic: boolean;
  accessRule?: {
    attributeId: string;
    operator: AccessOperator;
    optionId?: string | undefined;
    value?: string | undefined;
  } | undefined;
}

export interface TagListItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface ListInput {
  page: number;
  pageSize: number;
  search?: string | undefined;
}

function buildListQuery(input: ListInput): string {
  const query = new URLSearchParams({
    page: String(input.page),
    pageSize: String(input.pageSize),
  });

  if (input.search) {
    query.set("search", input.search);
  }

  return query.toString();
}

function signalInit(signal?: AbortSignal): RequestInit {
  return signal ? { signal } : {};
}

export function listPositions(
  input: ListInput,
  signal?: AbortSignal,
): Promise<PaginatedResponse<PositionListItem>> {
  return apiRequest(`/api/positions?${buildListQuery(input)}`, signalInit(signal));
}

export function listAvailablePositions(
  input: ListInput,
  signal?: AbortSignal,
): Promise<PaginatedResponse<CandidatePositionListItem>> {
  return apiRequest(
    `/api/positions/available?${buildListQuery(input)}`,
    signalInit(signal),
  );
}

export function getPosition(
  id: string,
  signal?: AbortSignal,
): Promise<RecruiterPositionDetail> {
  return apiRequest(`/api/positions/${id}`, signalInit(signal));
}

export function getAvailablePosition(
  id: string,
  signal?: AbortSignal,
): Promise<CandidatePositionDetail> {
  return apiRequest(
    `/api/positions/available/${id}`,
    signalInit(signal),
  );
}

export function createPosition(
  input: PositionInput,
): Promise<RecruiterPositionDetail> {
  return apiRequest("/api/positions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updatePosition(
  id: string,
  input: PositionInput & { version: number },
): Promise<RecruiterPositionDetail> {
  return apiRequest(`/api/positions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deletePosition(id: string): Promise<void> {
  return apiRequest(`/api/positions/${id}`, { method: "DELETE" });
}

export function listTags(
  input: ListInput,
  signal?: AbortSignal,
): Promise<PaginatedResponse<TagListItem>> {
  return apiRequest(`/api/tags?${buildListQuery(input)}`, signalInit(signal));
}
