import { useEffect, useState } from "react";
import { Alert } from "react-bootstrap";
import { Navigate, Outlet } from "react-router-dom";
import {
  getCurrentSession,
  getStoredAuthUser,
  logout,
  type AuthRole,
  type AuthUser,
} from "../api/authApi";
import { canAccessRoles } from "./rolePolicy";

interface RequireRoleProps {
  roles: readonly AuthRole[];
}

export function RequireRole({ roles }: RequireRoleProps) {
  const [hasStoredUser] = useState(() => Boolean(getStoredAuthUser()));
  const [user, setUser] = useState<AuthUser | undefined>(
    getStoredAuthUser,
  );
  const [isLoading, setIsLoading] = useState(hasStoredUser);

  useEffect(() => {
    let active = true;

    async function refreshSession() {
      try {
        const currentUser = await getCurrentSession();
        if (active) setUser(currentUser);
      } catch {
        logout();
        if (active) setUser(undefined);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    if (!hasStoredUser) return;

    void refreshSession();
    return () => {
      active = false;
    };
  }, [hasStoredUser]);

  if (isLoading) {
    return <Alert variant="info" className="m-3">Checking session...</Alert>;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!canAccessRoles(user.role, roles)) {
    const destination =
      user.role === "CANDIDATE"
        ? "/candidate/profile"
        : "/recruiter/positions";
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}
