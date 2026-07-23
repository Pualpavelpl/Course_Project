import { AppError } from "../../shared/errors/app-error.js";
import { getPagination } from "../../shared/http/pagination.js";
import { candidateEmailExists } from "../candidates/candidate.repository.js";
import {
  createRecruiterAccount,
  recruiterEmailExists,
} from "../recruiters/recruiter.repository.js";
import { hashPassword } from "../auth/password.js";
import {
  deleteUsers as deleteUserRecords,
  findAdminUsers,
  promoteRecruiter,
  setUsersBlocked,
} from "./admin-user.repository.js";
import type {
  AdminUserReference,
  CreateRecruiterRequest,
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

export async function createRecruiter(
  input: CreateRecruiterRequest["body"],
) {
  const [candidateExists, recruiterExists] = await Promise.all([
    candidateEmailExists(input.email),
    recruiterEmailExists(input.email),
  ]);

  if (candidateExists || recruiterExists) {
    throw new AppError(
      409,
      "EMAIL_CONFLICT",
      "Email is already registered",
    );
  }

  const passwordHash = await hashPassword(input.password);
  const result = await createRecruiterAccount(input.email, passwordHash);

  if (result.status === "email_conflict") {
    throw new AppError(
      409,
      "EMAIL_CONFLICT",
      "Email is already registered",
    );
  }

  return {
    id: result.recruiter.id,
    email: result.recruiter.email,
    role: "RECRUITER" as const,
    status: result.recruiter.isBlocked ? "BLOCKED" as const : "ACTIVE" as const,
    createdAt: result.recruiter.createdAt,
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
