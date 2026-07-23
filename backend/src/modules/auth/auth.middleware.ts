import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error.js";
import { findActiveAuthUser, verifyAccessToken } from "./auth.service.js";
import type {
  AuthenticatedRequest,
  AuthRole,
  AuthUser,
} from "./auth.types.js";

function extractBearerToken(authorizationHeader?: string): string | undefined {
  if (!authorizationHeader) {
    return undefined;
  }

  const [scheme, token, extraValue] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token || extraValue) {
    return undefined;
  }

  return token;
}

function getAuthUser(request: AuthenticatedRequest): AuthUser {
  if (!request.auth) {
    throw new AppError(
      401,
      "INVALID_SESSION",
      "Session is missing or invalid",
    );
  }

  return request.auth;
}

export const authenticate: RequestHandler = async (
  request,
  _response,
  next,
) => {
  try {
    const token = extractBearerToken(request.get("authorization"));

    if (!token) {
      throw new AppError(
        401,
        "INVALID_SESSION",
        "Session is missing or invalid",
      );
    }

    const tokenPayload = await verifyAccessToken(token);
    const authUser = await findActiveAuthUser(tokenPayload);

    (request as AuthenticatedRequest).auth = authUser;
    next();
  } catch (error) {
    next(error);
  }
};

export function requireRole(role: AuthRole): RequestHandler {
  return requireAnyRole([role]);
}

function requireAnyRole(roles: readonly AuthRole[]): RequestHandler {
  return (request, _response, next) => {
    const authUser = getAuthUser(request as AuthenticatedRequest);

    if (!roles.includes(authUser.role)) {
      next(
        new AppError(
          403,
          "INSUFFICIENT_ROLE",
          "You do not have access to this resource",
        ),
      );
      return;
    }

    next();
  };
}

export const requireCandidate = requireAnyRole(["CANDIDATE"]);
export const requireEmployee = requireAnyRole(["RECRUITER", "ADMIN"]);
export const requireAdmin = requireAnyRole(["ADMIN"]);

export function getAuthenticatedUser(request: AuthenticatedRequest): AuthUser {
  return getAuthUser(request);
}
