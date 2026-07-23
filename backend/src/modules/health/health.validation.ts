import { z } from "zod";

export const healthRequestSchema = z.strictObject({
  body: z.undefined().optional(),
  params: z.strictObject({}),
  query: z.strictObject({}),
});

export type HealthRequest = z.infer<typeof healthRequestSchema>;
