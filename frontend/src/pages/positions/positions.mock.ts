export interface PositionListItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export const initialPositions: PositionListItem[] = [
  {
    id: "frontend-developer",
    title: "Frontend Developer",
    createdAt: "2026-07-12",
    updatedAt: "2026-07-19",
  },
  {
    id: "backend-developer",
    title: "Backend Developer",
    createdAt: "2026-07-10",
    updatedAt: "2026-07-18",
  },
  {
    id: "qa-engineer",
    title: "QA Engineer",
    createdAt: "2026-07-08",
    updatedAt: "2026-07-16",
  },
];
