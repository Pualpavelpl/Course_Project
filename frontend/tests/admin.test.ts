import { describe, expect, it } from "vitest";
import {
  getEmployeeNavigation,
  recruiterNavigation,
} from "../src/config/recruiterNavigation";
import { getCandidatePagePermissions } from "../src/pages/candidate/candidatePermissions";
import { canAccessRoles } from "../src/shared/auth/rolePolicy";

describe("Admin frontend policies", () => {
  it("keeps Users route Admin-only while Employee routes allow Admin", () => {
    expect(canAccessRoles("RECRUITER", ["ADMIN"])).toBe(false);
    expect(canAccessRoles("ADMIN", ["ADMIN"])).toBe(true);
    expect(canAccessRoles("ADMIN", ["RECRUITER", "ADMIN"])).toBe(true);
  });

  it("composes Users onto the existing Employee navigation only for Admin", () => {
    expect(getEmployeeNavigation(false)).toBe(recruiterNavigation);
    expect(
      getEmployeeNavigation(false).some(({ label }) => label === "Users"),
    ).toBe(false);
    expect(
      getEmployeeNavigation(true).map(({ label }) => label),
    ).toEqual([
      "Positions",
      "Attribute library",
      "CV search",
      "Users",
    ]);
  });

  it("uses one permissions policy for Candidate, Recruiter and Admin CV modes", () => {
    expect(getCandidatePagePermissions("CANDIDATE")).toEqual({
      canEditProfile: true,
      canEditCv: true,
      canDeleteCv: true,
      canLikeCv: false,
    });
    expect(getCandidatePagePermissions("RECRUITER")).toEqual({
      canEditProfile: false,
      canEditCv: false,
      canDeleteCv: false,
      canLikeCv: true,
    });
    expect(getCandidatePagePermissions("ADMIN")).toEqual({
      canEditProfile: true,
      canEditCv: true,
      canDeleteCv: true,
      canLikeCv: true,
    });
  });
});
