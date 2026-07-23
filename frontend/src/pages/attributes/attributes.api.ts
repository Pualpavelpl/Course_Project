import { apiRequest } from "../../shared/api/apiClient";

export const attributeTypes = [
  "STRING",
  "NUMBER",
  "DATE",
  "PERIOD",
  "BOOLEAN",
  "SINGLE_SELECT",
] as const;

export type AttributeType = (typeof attributeTypes)[number];

export const attributeTypeLabels: Record<AttributeType, string> = {
  STRING: "String",
  NUMBER: "Numeric",
  DATE: "Date",
  PERIOD: "Period",
  BOOLEAN: "Boolean",
  SINGLE_SELECT: "One of many",
};

export const attributeCategories = [
  "PERSONAL_INFORMATION",
  "CERTIFICATION",
  "DOMAIN_KNOWLEDGE",
  "SOFT_SKILLS",
] as const;

export type AttributeCategory = (typeof attributeCategories)[number];

export const attributeCategoryLabels: Record<AttributeCategory, string> = {
  PERSONAL_INFORMATION: "Personal Information",
  CERTIFICATION: "Certification",
  DOMAIN_KNOWLEDGE: "Domain Knowledge",
  SOFT_SKILLS: "Soft Skills",
};

export interface AttributeListItem {
  id: string;
  name: string;
  description: string;
  category: AttributeCategory;
  createdAt: string;
  updatedAt: string;
}

export interface AttributeOption {
  id: string;
  value: string;
  sortOrder: number;
}

export interface AttributeDetail extends AttributeListItem {
  type: AttributeType;
  isBuiltin: boolean;
  version: number;
  options: AttributeOption[];
}

export interface AttributeInput {
  name: string;
  description: string;
  type: AttributeType;
  category: AttributeCategory;
  options?: string[] | undefined;
}

interface ListAttributesInput {
  page: number;
  pageSize: number;
  search?: string | undefined;
  category?: AttributeCategory | undefined;
}

interface AttributeListResponse {
  items: AttributeListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

function buildAttributeQuery(input: ListAttributesInput): string {
  const query = new URLSearchParams({
    page: String(input.page),
    pageSize: String(input.pageSize),
  });

  if (input.search) {
    query.set("search", input.search);
  }

  if (input.category) {
    query.set("category", input.category);
  }

  return query.toString();
}

export function listAttributes(
  input: ListAttributesInput,
  signal?: AbortSignal,
): Promise<AttributeListResponse> {
  return apiRequest<AttributeListResponse>(
    `/api/attributes?${buildAttributeQuery(input)}`,
    signal ? { signal } : {},
  );
}

export function getAttribute(
  id: string,
  signal?: AbortSignal,
): Promise<AttributeDetail> {
  return apiRequest<AttributeDetail>(
    `/api/attributes/${id}`,
    signal ? { signal } : {},
  );
}

export function createAttribute(
  input: AttributeInput,
): Promise<AttributeDetail> {
  return apiRequest<AttributeDetail>("/api/attributes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAttribute(
  id: string,
  input: AttributeInput & { version: number },
): Promise<AttributeDetail> {
  return apiRequest<AttributeDetail>(`/api/attributes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function updateBuiltinAttribute(
  id: string,
  version: number,
  description: string,
): Promise<AttributeDetail> {
  return apiRequest<AttributeDetail>(`/api/attributes/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ version, description }),
  });
}

export function deleteAttribute(id: string): Promise<void> {
  return apiRequest<void>(`/api/attributes/${id}`, {
    method: "DELETE",
  });
}
