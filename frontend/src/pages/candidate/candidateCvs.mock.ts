export interface CandidateCvListItem {
  id: string;
  positionId: string;
  positionName: string;
  createdAt: string;
}

export const initialCandidateCvs: CandidateCvListItem[] = [
  {
    id: "cv-anna-frontend",
    positionId: "frontend-developer",
    positionName: "Frontend Developer",
    createdAt: "2026-07-20 14:35",
  },
  {
    id: "cv-anna-backend",
    positionId: "backend-developer",
    positionName: "Backend Developer",
    createdAt: "2026-07-18 11:20",
  },
  {
    id: "cv-anna-qa",
    positionId: "qa-engineer",
    positionName: "QA Engineer",
    createdAt: "2026-07-16 09:10",
  },
];
