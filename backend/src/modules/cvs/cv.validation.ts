import { z } from "zod";

const emptyParamsSchema = z.strictObject({});
const emptyBodySchema = z.undefined().optional();
const cvIdParamsSchema = z.strictObject({ cvId: z.uuid() });
const cvListQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z
    .string()
    .trim()
    .max(255)
    .transform((value) => value || undefined)
    .optional(),
});
const recruiterCvListQuerySchema = cvListQuerySchema.extend({
  positionId: z.uuid().optional(),
  liked: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});
const profileAttributeValueSchema = z.strictObject({
  attributeId: z.uuid(),
  value: z.string().max(1_000).optional(),
  optionId: z.uuid().optional(),
});

export const listCvsRequestSchema = z.strictObject({
  body: emptyBodySchema,
  params: emptyParamsSchema,
  query: cvListQuerySchema,
});

export const getCvRequestSchema = z.strictObject({
  body: emptyBodySchema,
  params: cvIdParamsSchema,
  query: z.strictObject({}),
});

export const listRecruiterCvsRequestSchema = z.strictObject({
  body: emptyBodySchema,
  params: emptyParamsSchema,
  query: recruiterCvListQuerySchema,
});

export const createCvRequestSchema = z.strictObject({
  body: z.strictObject({ positionId: z.uuid() }),
  params: emptyParamsSchema,
  query: z.strictObject({}),
});

export const updateCvProfileAttributesRequestSchema = z.strictObject({
  body: z.strictObject({
    version: z.number().int().min(1),
    attributes: z.array(profileAttributeValueSchema).min(1).max(100),
  }),
  params: cvIdParamsSchema,
  query: z.strictObject({}),
});

export const deleteCvRequestSchema = getCvRequestSchema;

export type ListCvsRequest = z.infer<typeof listCvsRequestSchema>;
export type GetCvRequest = z.infer<typeof getCvRequestSchema>;
export type ListRecruiterCvsRequest = z.infer<
  typeof listRecruiterCvsRequestSchema
>;
export type CreateCvRequest = z.infer<typeof createCvRequestSchema>;
export type UpdateCvProfileAttributesRequest = z.infer<
  typeof updateCvProfileAttributesRequestSchema
>;
export type DeleteCvRequest = z.infer<typeof deleteCvRequestSchema>;
