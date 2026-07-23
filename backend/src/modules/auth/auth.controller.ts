import type { Request, Response } from "express";
import { getValidatedRequest } from "../../middleware/validation.middleware.js";
import { getAuthenticatedUser } from "./auth.middleware.js";
import {
  loginCandidate,
  loginRecruiter,
  registerCandidate,
} from "./auth.service.js";
import type { AuthenticatedRequest } from "./auth.types.js";
import type {
  CandidateRegistrationRequest,
  LoginRequest,
} from "./auth.validation.js";

export async function registerCandidateAccount(
  _request: Request,
  response: Response,
): Promise<void> {
  const { body } =
    getValidatedRequest<CandidateRegistrationRequest>(response);
  const authResponse = await registerCandidate(body.email, body.password);

  response.status(201).json(authResponse);
}

export async function loginCandidateAccount(
  _request: Request,
  response: Response,
): Promise<void> {
  const { body } = getValidatedRequest<LoginRequest>(response);
  const authResponse = await loginCandidate(body.email, body.password);

  response.status(200).json(authResponse);
}

export async function loginRecruiterAccount(
  _request: Request,
  response: Response,
): Promise<void> {
  const { body } = getValidatedRequest<LoginRequest>(response);
  const authResponse = await loginRecruiter(body.email, body.password);

  response.status(200).json(authResponse);
}

export function getCurrentSession(
  request: Request,
  response: Response,
): void {
  const user = getAuthenticatedUser(request as AuthenticatedRequest);

  response.status(200).json({ user });
}
