import { z } from "zod";

const emptyParamsSchema = z.strictObject({});
const emptyBodySchema = z.undefined().optional();
const emptyQuerySchema = z.strictObject({});
const adminUserRoleSchema = z.enum([
  "CANDIDATE",
  "RECRUITER",
  "ADMIN",
]);
const adminUserReferenceSchema = z.strictObject({
  id: z.uuid(),
  role: adminUserRoleSchema,
});

export const listAdminUsersRequestSchema = z.strictObject({
  body: emptyBodySchema,
  params: emptyParamsSchema,
  query: z.strictObject({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z
      .string()
      .trim()
      .max(255)
      .transform((value) => value || undefined)
      .optional(),
    role: z.enum(["ALL", "CANDIDATE", "RECRUITER", "ADMIN"]).default("ALL"),
    status: z.enum(["ALL", "ACTIVE", "BLOCKED"]).default("ALL"),
  }),
});

export const mutateAdminUsersRequestSchema = z.strictObject({
  body: z.array(adminUserReferenceSchema).min(1).max(100),
  params: emptyParamsSchema,
  query: emptyQuerySchema,
});

export const promoteRecruiterRequestSchema = z.strictObject({
  body: emptyBodySchema,
  params: z.strictObject({
    recruiterId: z.uuid(),
  }),
  query: emptyQuerySchema,
});

export type AdminUserRole = z.infer<typeof adminUserRoleSchema>;
export type AdminUserReference = z.infer<
  typeof adminUserReferenceSchema
>;
export type ListAdminUsersRequest = z.infer<
  typeof listAdminUsersRequestSchema
>;
export type MutateAdminUsersRequest = z.infer<
  typeof mutateAdminUsersRequestSchema
>;
export type PromoteRecruiterRequest = z.infer<
  typeof promoteRecruiterRequestSchema
>;
