import { z } from "zod";

export const listTagsRequestSchema = z.strictObject({
  body: z.undefined().optional(),
  params: z.strictObject({}),
  query: z.strictObject({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z
      .string()
      .trim()
      .max(100)
      .transform((value) => value || undefined)
      .optional(),
  }),
});

export type ListTagsRequest = z.infer<typeof listTagsRequestSchema>;
