import { z } from "zod";
import {
  AttributeCategory,
  AttributeType,
} from "../../generated/prisma/enums.js";

const emptyParamsSchema = z.strictObject({});
const emptyQuerySchema = z.strictObject({});
const emptyBodySchema = z.undefined().optional();
const attributeIdParamsSchema = z.strictObject({
  id: z.uuid(),
});

const attributeNameSchema = z.string().trim().min(1).max(255);
const attributeDescriptionSchema = z.string().trim().min(1).max(5_000);
const attributeOptionsSchema = z
  .array(z.string().trim().min(1).max(255))
  .max(100);

const attributeFieldsSchema = {
  name: attributeNameSchema,
  description: attributeDescriptionSchema,
  type: z.enum(AttributeType),
  category: z.enum(AttributeCategory),
  options: attributeOptionsSchema.optional(),
};

export const listAttributesRequestSchema = z.strictObject({
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

export const getAttributeRequestSchema = z.strictObject({
  body: emptyBodySchema,
  params: attributeIdParamsSchema,
  query: emptyQuerySchema,
});

export const createAttributeRequestSchema = z.strictObject({
  body: z.strictObject(attributeFieldsSchema),
  params: emptyParamsSchema,
  query: emptyQuerySchema,
});

export const updateAttributeRequestSchema = z.strictObject({
  body: z
    .strictObject({
      version: z.number().int().min(1),
      name: attributeFieldsSchema.name.optional(),
      description: attributeFieldsSchema.description.optional(),
      type: attributeFieldsSchema.type.optional(),
      category: attributeFieldsSchema.category.optional(),
      options: attributeFieldsSchema.options,
    })
    .refine(
      ({ version: _version, ...fields }) =>
        Object.values(fields).some((value) => value !== undefined),
      { message: "At least one Attribute field is required" },
    ),
  params: attributeIdParamsSchema,
  query: emptyQuerySchema,
});

export const deleteAttributeRequestSchema = getAttributeRequestSchema;

export type ListAttributesRequest = z.infer<
  typeof listAttributesRequestSchema
>;
export type GetAttributeRequest = z.infer<typeof getAttributeRequestSchema>;
export type CreateAttributeRequest = z.infer<
  typeof createAttributeRequestSchema
>;
export type UpdateAttributeRequest = z.infer<
  typeof updateAttributeRequestSchema
>;
export type DeleteAttributeRequest = z.infer<
  typeof deleteAttributeRequestSchema
>;
