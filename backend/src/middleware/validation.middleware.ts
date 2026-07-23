import type { RequestHandler, Response } from "express";
import type { ZodType } from "zod";
import { AppError } from "../shared/errors/app-error.js";

export function validateRequest(schema: ZodType): RequestHandler {
  return (request, response, next) => {
    const result = schema.safeParse({
      body: request.body,
      params: request.params,
      query: request.query,
    });

    if (!result.success) {
      next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
      return;
    }

    response.locals.validatedRequest = result.data;
    next();
  };
}

export function getValidatedRequest<T>(response: Response): T {
  return response.locals.validatedRequest as T;
}
