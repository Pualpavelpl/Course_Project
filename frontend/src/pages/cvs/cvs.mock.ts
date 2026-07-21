export interface CvSearchListItem {
  id: string;
  positionId: string;
  positionName: string;
  profileId: string;
  profileName: string;
  createdAt: string;
  liked: boolean;
}

export const initialCvs: CvSearchListItem[] = [
  {
    id: "cv-anna-frontend",
    positionId: "frontend-developer",
    positionName: "Frontend Developer",
    profileId: "anna-kowalska",
    profileName: "Anna Kowalska",
    createdAt: "2026-07-20 14:35",
    liked: false,
  },
  {
    id: "cv-peter-backend",
    positionId: "backend-developer",
    positionName: "Backend Developer",
    profileId: "peter-nowak",
    profileName: "Peter Nowak",
    createdAt: "2026-07-19 10:15",
    liked: true,
  },
  {
    id: "cv-maria-qa",
    positionId: "qa-engineer",
    positionName: "QA Engineer",
    profileId: "maria-ivanova",
    profileName: "Maria Ivanova",
    createdAt: "2026-07-18 09:40",
    liked: false,
  },
];
