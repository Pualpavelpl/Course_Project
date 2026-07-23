import type { NavigationItem } from "./navigation";

export const recruiterNavigation: NavigationItem[] = [
  {
    label: "Positions",
    path: "/recruiter/positions",
  },
  {
    label: "Attribute library",
    path: "/recruiter/attributes",
  },
  {
    label: "CV search",
    path: "/recruiter/cv-search",
  },
];

const adminUsersNavigation: NavigationItem = {
  label: "Users",
  path: "/admin/users",
};

export function getEmployeeNavigation(
  isAdmin: boolean,
): NavigationItem[] {
  return isAdmin
    ? [...recruiterNavigation, adminUsersNavigation]
    : recruiterNavigation;
}
