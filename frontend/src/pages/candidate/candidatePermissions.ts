import type { AuthRole } from "../../shared/api/authApi";

export interface CandidatePagePermissions {
  canEditProfile: boolean;
  canEditCv: boolean;
  canDeleteCv: boolean;
  canLikeCv: boolean;
}

export function getCandidatePagePermissions(
  role: AuthRole,
): CandidatePagePermissions {
  if (role === "ADMIN") {
    return {
      canEditProfile: true,
      canEditCv: true,
      canDeleteCv: true,
      canLikeCv: true,
    };
  }

  if (role === "CANDIDATE") {
    return {
      canEditProfile: true,
      canEditCv: true,
      canDeleteCv: true,
      canLikeCv: false,
    };
  }

  return {
    canEditProfile: false,
    canEditCv: false,
    canDeleteCv: false,
    canLikeCv: true,
  };
}
