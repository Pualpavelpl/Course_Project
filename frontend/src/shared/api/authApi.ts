import type { Credentials } from "../auth/CredentialsForm";
import {
  apiRequest,
  clearAccessToken,
  saveAccessToken,
} from "./apiClient";

export type AuthRole = "CANDIDATE" | "RECRUITER" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  role: AuthRole;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

const AUTH_USER_KEY = "course-project-auth-user";

function saveAuthUser(user: AuthUser): void {
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

async function authenticate(
  path: string,
  credentials: Credentials,
): Promise<AuthUser> {
  const response = await apiRequest<AuthResponse>(path, {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  saveAccessToken(response.token);
  saveAuthUser(response.user);
  return response.user;
}

export function registerCandidate(
  credentials: Credentials,
): Promise<AuthUser> {
  return authenticate("/api/auth/candidates/register", credentials);
}

export function loginCandidate(
  credentials: Credentials,
): Promise<AuthUser> {
  return authenticate("/api/auth/candidates/login", credentials);
}

export function loginRecruiter(
  credentials: Credentials,
): Promise<AuthUser> {
  return authenticate("/api/auth/recruiters/login", credentials);
}

export async function getCurrentSession(): Promise<AuthUser> {
  const response = await apiRequest<{ user: AuthUser }>("/api/auth/session");

  saveAuthUser(response.user);
  return response.user;
}

export function getStoredAuthUser(): AuthUser | undefined {
  const storedUser = sessionStorage.getItem(AUTH_USER_KEY);

  if (!storedUser) return undefined;

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    sessionStorage.removeItem(AUTH_USER_KEY);
    return undefined;
  }
}

export function logout(): void {
  clearAccessToken();
  sessionStorage.removeItem(AUTH_USER_KEY);
}
