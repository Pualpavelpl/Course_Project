import { SignJWT, jwtVerify } from "jose";
import {
  candidateEmailExists,
  createCandidateWithProfile,
  findCandidateCredentialsByEmail,
  findCandidateSessionById,
} from "../candidates/candidate.repository.js";
import {
  findRecruiterCredentialsByEmail,
  findRecruiterSessionById,
  recruiterEmailExists,
} from "../recruiters/recruiter.repository.js";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthResponse, AuthRole, AuthUser } from "./auth.types.js";
import {
  authTokenPayloadSchema,
  type AuthTokenPayload,
} from "./auth.validation.js";
import { hashPassword, verifyPassword } from "./password.js";

const JWT_ALGORITHM = "HS256";
const JWT_ISSUER = "course-project-api";
const JWT_AUDIENCE = "course-project-web";
const dummyPasswordHash = hashPassword("not-a-real-user-password");

interface CredentialsAccount {
  id: string;
  email: string;
  passwordHash: string;
  isBlocked: boolean;
  effectiveRole?: AuthRole;
}

type ResolveAccountRole = (account: CredentialsAccount) => AuthRole;

type FindCredentialsByEmail = (
  email: string,
) => Promise<CredentialsAccount | null>;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getJwtSecret(): Uint8Array {
  return new TextEncoder().encode(env.JWT_SECRET);
}

async function createAccessToken(
  subject: string,
  role: AuthRole,
): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setSubject(subject)
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(getJwtSecret());
}

async function createAuthResponse(user: AuthUser): Promise<AuthResponse> {
  return {
    token: await createAccessToken(user.id, user.role),
    user,
  };
}

function createInvalidCredentialsError(): AppError {
  return new AppError(
    401,
    "INVALID_CREDENTIALS",
    "Invalid email or password",
  );
}

async function loginWithCredentials(
  email: string,
  password: string,
  resolveRole: ResolveAccountRole,
  findCredentialsByEmail: FindCredentialsByEmail,
): Promise<AuthResponse> {
  const normalizedEmail = normalizeEmail(email);
  const account = await findCredentialsByEmail(normalizedEmail);
  const passwordHash = account?.passwordHash ?? (await dummyPasswordHash);
  const passwordMatches = await verifyPassword(password, passwordHash);

  if (!account || !passwordMatches) {
    throw createInvalidCredentialsError();
  }

  if (account.isBlocked) {
    throw new AppError(403, "ACCOUNT_BLOCKED", "Account is blocked");
  }

  return createAuthResponse({
    id: account.id,
    email: account.email,
    role: resolveRole(account),
  });
}

export async function registerCandidate(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const normalizedEmail = normalizeEmail(email);
  const [candidateExists, recruiterExists] = await Promise.all([
    candidateEmailExists(normalizedEmail),
    recruiterEmailExists(normalizedEmail),
  ]);

  if (candidateExists || recruiterExists) {
    throw new AppError(409, "EMAIL_CONFLICT", "Email is already registered");
  }

  const passwordHash = await hashPassword(password);
  const creationResult = await createCandidateWithProfile(
    normalizedEmail,
    passwordHash,
  );

  if (creationResult.status === "email_conflict") {
    throw new AppError(409, "EMAIL_CONFLICT", "Email is already registered");
  }

  return createAuthResponse({
    id: creationResult.candidate.id,
    email: creationResult.candidate.email,
    role: "CANDIDATE",
  });
}

export function loginCandidate(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return loginWithCredentials(
    email,
    password,
    () => "CANDIDATE",
    findCandidateCredentialsByEmail,
  );
}

export function loginRecruiter(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return loginWithCredentials(
    email,
    password,
    (account) => account.effectiveRole ?? "RECRUITER",
    findRecruiterCredentialsByEmail,
  );
}

export async function verifyAccessToken(
  token: string,
): Promise<AuthTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    const tokenPayload = authTokenPayloadSchema.safeParse({
      subject: payload.sub,
      role: payload.role,
    });

    if (!tokenPayload.success) {
      throw new Error("Invalid token payload");
    }

    return tokenPayload.data;
  } catch {
    throw new AppError(
      401,
      "INVALID_SESSION",
      "Session is missing or invalid",
    );
  }
}

export async function findActiveAuthUser(
  tokenPayload: AuthTokenPayload,
): Promise<AuthUser> {
  if (tokenPayload.role === "CANDIDATE") {
    const candidate = await findCandidateSessionById(tokenPayload.subject);

    if (!candidate || candidate.isBlocked) {
      throw createInvalidSessionError();
    }

    return {
      id: candidate.id,
      email: candidate.email,
      role: "CANDIDATE",
    };
  }

  const employee = await findRecruiterSessionById(tokenPayload.subject);

  if (!employee || employee.isBlocked) {
    throw createInvalidSessionError();
  }

  return {
    id: employee.id,
    email: employee.email,
    role: employee.effectiveRole,
  };
}

function createInvalidSessionError(): AppError {
  return new AppError(
    401,
    "INVALID_SESSION",
    "Session is missing or invalid",
  );
}
