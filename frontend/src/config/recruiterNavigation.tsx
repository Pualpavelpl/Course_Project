export interface NavigationItem {
  label: string;
  path: string;
}

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
