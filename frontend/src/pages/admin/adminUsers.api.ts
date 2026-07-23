import { apiRequest } from "../../shared/api/apiClient";

export type AdminUserRole = "CANDIDATE" | "RECRUITER" | "ADMIN";
export type AdminUserStatus = "ACTIVE" | "BLOCKED";

export interface AdminUserListItem {
  id: string;
  email: string;
  displayName: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  profileId: string | null;
  createdAt: string;
}

export interface AdminUserReference {
  id: string;
  role: AdminUserRole;
}

interface ListAdminUsersInput {
  page: number;
  pageSize: number;
  search?: string | undefined;
  role?: AdminUserRole | undefined;
  status?: AdminUserStatus | undefined;
}

interface AdminUserListResponse {
  items: AdminUserListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

function buildAdminUsersQuery(input: ListAdminUsersInput): string {
  const query = new URLSearchParams({
    page: String(input.page),
    pageSize: String(input.pageSize),
    role: input.role ?? "ALL",
    status: input.status ?? "ALL",
  });

  if (input.search) query.set("search", input.search);
  return query.toString();
}

export function listAdminUsers(
  input: ListAdminUsersInput,
  signal?: AbortSignal,
): Promise<AdminUserListResponse> {
  return apiRequest(
    `/api/admin/users?${buildAdminUsersQuery(input)}`,
    signal ? { signal } : {},
  );
}

function mutateUsers(
  path: string,
  method: "PATCH" | "DELETE",
  users: AdminUserReference[],
): Promise<{ updated: number } | void> {
  return apiRequest(path, {
    method,
    body: JSON.stringify(users),
  });
}

export function blockAdminUsers(
  users: AdminUserReference[],
): Promise<{ updated: number } | void> {
  return mutateUsers("/api/admin/users/block", "PATCH", users);
}

export function unblockAdminUsers(
  users: AdminUserReference[],
): Promise<{ updated: number } | void> {
  return mutateUsers("/api/admin/users/unblock", "PATCH", users);
}

export function deleteAdminUsers(
  users: AdminUserReference[],
): Promise<{ updated: number } | void> {
  return mutateUsers("/api/admin/users", "DELETE", users);
}

export function promoteRecruiter(
  recruiterId: string,
): Promise<{
  recruiterId: string;
  role: "ADMIN";
  createdAt: string;
}> {
  return apiRequest(
    `/api/admin/recruiters/${recruiterId}/promote`,
    { method: "POST" },
  );
}
