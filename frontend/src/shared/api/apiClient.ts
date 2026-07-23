const ACCESS_TOKEN_KEY = "course-project-access-token";

interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getApiBaseUrl(): string {
  const apiBaseUrl = import.meta.env.VITE_API_URL;

  if (!apiBaseUrl) {
    throw new Error("VITE_API_URL environment variable is required");
  }

  return apiBaseUrl.replace(/\/$/, "");
}

function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function saveAccessToken(token: string): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const accessToken = getAccessToken();

  headers.set("Accept", "application/json");

  if (init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });
  const payload = (await response.json().catch(() => ({}))) as
    | T
    | ApiErrorPayload;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload;

    throw new ApiError(
      response.status,
      errorPayload.error?.code ?? "REQUEST_FAILED",
      errorPayload.error?.message ?? "Request failed",
    );
  }

  return payload as T;
}

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  return error instanceof ApiError ? error.message : fallbackMessage;
}
