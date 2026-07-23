import { z } from "zod";
import { AttributeCategory } from "../../generated/prisma/enums.js";

const emptyParamsSchema = z.strictObject({});
const emptyQuerySchema = z.strictObject({});
const emptyBodySchema = z.undefined().optional();
const attributeIdParamsSchema = z.strictObject({
  attributeId: z.uuid(),
});

const profileValueFields = {
  value: z.string().max(1_000).optional(),
  optionId: z.uuid().optional(),
};

const profileAttributeValueSchema = z.strictObject({
  attributeId: z.uuid(),
  ...profileValueFields,
});

export const getMyProfileRequestSchema = z.strictObject({
  body: emptyBodySchema,
  params: emptyParamsSchema,
  query: emptyQuerySchema,
});

export const listAvailableProfileAttributesRequestSchema = z.strictObject({
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
    category: z.enum(AttributeCategory).optional(),
  }),
});

export const updateMyProfileRequestSchema = z.strictObject({
  body: z.strictObject({
    version: z.number().int().min(1),
    attributes: z.array(profileAttributeValueSchema).min(1).max(100),
  }),
  params: emptyParamsSchema,
  query: emptyQuerySchema,
});

export const createProfileAttributeRequestSchema = z.strictObject({
  body: z.strictObject({
    version: z.number().int().min(1),
    attributeId: z.uuid(),
    ...profileValueFields,
  }),
  params: emptyParamsSchema,
  query: emptyQuerySchema,
});

export const updateProfileAttributeRequestSchema = z.strictObject({
  body: z.strictObject({
    version: z.number().int().min(1),
    ...profileValueFields,
  }),
  params: attributeIdParamsSchema,
  query: emptyQuerySchema,
});

export const deleteProfileAttributeRequestSchema = z.strictObject({
  body: z.strictObject({
    version: z.number().int().min(1),
  }),
  params: attributeIdParamsSchema,
  query: emptyQuerySchema,
});

export type GetMyProfileRequest = z.infer<
  typeof getMyProfileRequestSchema
>;
export type ListAvailableProfileAttributesRequest = z.infer<
  typeof listAvailableProfileAttributesRequestSchema
>;
export type UpdateMyProfileRequest = z.infer<
  typeof updateMyProfileRequestSchema
>;
export type CreateProfileAttributeRequest = z.infer<
  typeof createProfileAttributeRequestSchema
>;
export type UpdateProfileAttributeRequest = z.infer<
  typeof updateProfileAttributeRequestSchema
>;
export type DeleteProfileAttributeRequest = z.infer<
  typeof deleteProfileAttributeRequestSchema
>;
