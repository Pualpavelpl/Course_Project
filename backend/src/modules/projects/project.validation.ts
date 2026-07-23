import { z } from "zod";

const emptyParamsSchema = z.strictObject({});
const emptyQuerySchema = z.strictObject({});
const emptyBodySchema = z.undefined().optional();
const projectIdParamsSchema = z.strictObject({ projectId: z.uuid() });
const isoDateSchema = z.iso.date();

const projectFieldsSchema = {
  name: z.string().trim().min(1).max(255),
  periodStart: isoDateSchema,
  periodEnd: isoDateSchema.nullable().optional(),
  description: z.string().min(1).max(100_000),
  tags: z.array(z.string().trim().min(1).max(100)).max(50),
};

export const listProjectsRequestSchema = z.strictObject({
  body: emptyBodySchema,
  params: emptyParamsSchema,
  query: emptyQuerySchema,
});

export const getProjectRequestSchema = z.strictObject({
  body: emptyBodySchema,
  params: projectIdParamsSchema,
  query: emptyQuerySchema,
});

export const createProjectRequestSchema = z.strictObject({
  body: z.strictObject(projectFieldsSchema),
  params: emptyParamsSchema,
  query: emptyQuerySchema,
});

export const updateProjectRequestSchema = z.strictObject({
  body: z
    .strictObject({
      name: projectFieldsSchema.name.optional(),
      periodStart: projectFieldsSchema.periodStart.optional(),
      periodEnd: projectFieldsSchema.periodEnd,
      description: projectFieldsSchema.description.optional(),
      tags: projectFieldsSchema.tags.optional(),
    })
    .refine(
      (fields) =>
        Object.values(fields).some((value) => value !== undefined),
      { message: "At least one Project field is required" },
    ),
  params: projectIdParamsSchema,
  query: emptyQuerySchema,
});

export const deleteProjectRequestSchema = getProjectRequestSchema;

export type ListProjectsRequest = z.infer<
  typeof listProjectsRequestSchema
>;
export type GetProjectRequest = z.infer<typeof getProjectRequestSchema>;
export type CreateProjectRequest = z.infer<
  typeof createProjectRequestSchema
>;
export type UpdateProjectRequest = z.infer<
  typeof updateProjectRequestSchema
>;
export type DeleteProjectRequest = z.infer<
  typeof deleteProjectRequestSchema
>;
