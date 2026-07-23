import type { AuthRole } from "../api/authApi";

export function canAccessRoles(
  role: AuthRole,
  allowedRoles: readonly AuthRole[],
): boolean {
  return allowedRoles.includes(role);
}
