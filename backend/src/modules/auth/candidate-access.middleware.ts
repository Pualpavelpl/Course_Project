import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error.js";
import { getAuthenticatedUser } from "./auth.middleware.js";
import type {
  AuthenticatedRequest,
  AuthUser,
} from "./auth.types.js";

export function canManageCandidateProfile(
  actor: AuthUser,
  candidateId: string,
): boolean {
  return (
    actor.role === "ADMIN" ||
    (actor.role === "CANDIDATE" && actor.id === candidateId)
  );
}

function assignCandidateTarget(
  request: AuthenticatedRequest,
  candidateId: string | undefined,
): void {
  const actor = getAuthenticatedUser(request);

  if (!candidateId || !canManageCandidateProfile(actor, candidateId)) {
    throw new AppError(
      403,
      "CANDIDATE_MANAGEMENT_FORBIDDEN",
      "You cannot manage this Candidate",
    );
  }

  request.targetCandidateId = candidateId;
}

export const authorizeOwnCandidateProfile: RequestHandler = (
  request,
  _response,
  next,
) => {
  try {
    const authenticatedRequest = request as AuthenticatedRequest;
    assignCandidateTarget(
      authenticatedRequest,
      getAuthenticatedUser(authenticatedRequest).id,
    );
    next();
  } catch (error) {
    next(error);
  }
};

export const authorizeAdminCandidateProfile: RequestHandler = (
  request,
  _response,
  next,
) => {
  try {
    const candidateId = request.params.candidateId;
    assignCandidateTarget(
      request as AuthenticatedRequest,
      Array.isArray(candidateId) ? candidateId[0] : candidateId,
    );
    next();
  } catch (error) {
    next(error);
  }
};

export function getTargetCandidateId(
  request: AuthenticatedRequest,
): string {
  if (!request.targetCandidateId) {
    throw new AppError(
      403,
      "CANDIDATE_MANAGEMENT_FORBIDDEN",
      "Candidate target was not authorized",
    );
  }

  return request.targetCandidateId;
}
