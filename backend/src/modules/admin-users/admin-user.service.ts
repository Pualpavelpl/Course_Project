import { AppError } from "../../shared/errors/app-error.js";
import { getPagination } from "../../shared/http/pagination.js";
import {
  deleteUsers as deleteUserRecords,
  findAdminUsers,
  promoteRecruiter,
  setUsersBlocked,
} from "./admin-user.repository.js";
import type {
  AdminUserReference,
  ListAdminUsersRequest,
} from "./admin-user.validation.js";

export function splitUserReferences(
  users: AdminUserReference[],
): {
  candidateIds: string[];
  employeeIds: string[];
} {
  return users.reduce(
    (groups, user) => {
      if (user.role === "CANDIDATE") {
        groups.candidateIds.push(user.id);
      } else {
        groups.employeeIds.push(user.id);
      }

      return groups;
    },
    { candidateIds: [] as string[], employeeIds: [] as string[] },
  );
}

export async function listAdminUsers(
  query: ListAdminUsersRequest["query"],
) {
  const { skip, take } = getPagination(query.page, query.pageSize);
  const result = await findAdminUsers({
    skip,
    take,
    search: query.search,
    role: query.role === "ALL" ? undefined : query.role,
    status: query.status === "ALL" ? undefined : query.status,
  });

  return {
    items: result.items,
    pagination: {
      page: query.page,
      pageSize: take,
      total: result.total,
      totalPages: Math.ceil(result.total / take),
    },
  };
}

export async function changeUsersBlockedStatus(
  users: AdminUserReference[],
  isBlocked: boolean,
) {
  const updated = await setUsersBlocked(
    splitUserReferences(users),
    isBlocked,
  );

  return { updated };
}

export async function deleteAdminUsers(
  users: AdminUserReference[],
): Promise<void> {
  await deleteUserRecords(splitUserReferences(users));
}

export async function promoteRecruiterToAdmin(recruiterId: string) {
  const result = await promoteRecruiter(recruiterId);

  if (result.status === "not_found") {
    throw new AppError(
      404,
      "RECRUITER_NOT_FOUND",
      "Recruiter not found",
    );
  }

  if (result.status === "already_admin") {
    throw new AppError(
      409,
      "RECRUITER_ALREADY_ADMIN",
      "Recruiter is already an Admin",
    );
  }

  return {
    recruiterId: result.admin.recruiterId,
    role: "ADMIN" as const,
    createdAt: result.admin.createdAt,
  };
}
