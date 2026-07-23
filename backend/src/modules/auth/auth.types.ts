import type { Request } from "express";

export const AUTH_ROLES = ["CANDIDATE", "RECRUITER", "ADMIN"] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];

export interface AuthUser {
  id: string;
  email: string;
  role: AuthRole;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthUser;
  targetCandidateId?: string;
}
