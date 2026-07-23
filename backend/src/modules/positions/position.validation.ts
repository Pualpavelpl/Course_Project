import { z } from "zod";
import { AccessOperator } from "../../generated/prisma/enums.js";

const emptyParamsSchema = z.strictObject({});
const emptyBodySchema = z.undefined().optional();
const positionIdParamsSchema = z.strictObject({ id: z.uuid() });

const positionListQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z
    .string()
    .trim()
    .max(255)
    .transform((value) => value || undefined)
    .optional(),
});

const accessRuleSchema = z.strictObject({
  attributeId: z.uuid(),
  operator: z.enum(AccessOperator),
  optionId: z.uuid().optional(),
  value: z.string().max(1_000).optional(),
});

const positionFieldsSchema = {
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1).max(5_000),
  maxProjects: z.number().int().min(0).max(100),
  attributeIds: z.array(z.uuid()).min(1).max(100),
  tags: z.array(z.string().trim().min(1).max(100)).max(50),
  isPublic: z.boolean(),
  accessRule: accessRuleSchema.optional(),
};

export const listPositionsRequestSchema = z.strictObject({
  body: emptyBodySchema,
  params: emptyParamsSchema,
  query: positionListQuerySchema,
});

export const getPositionRequestSchema = z.strictObject({
  body: emptyBodySchema,
  params: positionIdParamsSchema,
  query: z.strictObject({}),
});

export const createPositionRequestSchema = z.strictObject({
  body: z.strictObject(positionFieldsSchema),
  params: emptyParamsSchema,
  query: z.strictObject({}),
});

export const updatePositionRequestSchema = z.strictObject({
  body: z
    .strictObject({
      version: z.number().int().min(1),
      name: positionFieldsSchema.name.optional(),
      description: positionFieldsSchema.description.optional(),
      maxProjects: positionFieldsSchema.maxProjects.optional(),
      attributeIds: positionFieldsSchema.attributeIds.optional(),
      tags: positionFieldsSchema.tags.optional(),
      isPublic: positionFieldsSchema.isPublic.optional(),
      accessRule: positionFieldsSchema.accessRule,
    })
    .refine(
      ({ version: _version, ...fields }) =>
        Object.values(fields).some((value) => value !== undefined),
      { message: "At least one Position field is required" },
    ),
  params: positionIdParamsSchema,
  query: z.strictObject({}),
});

export const deletePositionRequestSchema = getPositionRequestSchema;

export type ListPositionsRequest = z.infer<
  typeof listPositionsRequestSchema
>;
export type GetPositionRequest = z.infer<typeof getPositionRequestSchema>;
export type CreatePositionRequest = z.infer<
  typeof createPositionRequestSchema
>;
export type UpdatePositionRequest = z.infer<
  typeof updatePositionRequestSchema
>;
export type DeletePositionRequest = z.infer<
  typeof deletePositionRequestSchema
>;
