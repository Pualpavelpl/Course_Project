export interface PositionListItem {
  id: string;
  name: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const initialPositions: PositionListItem[] = [
  {
    id: "frontend-developer",
    name: "Frontend Developer",
    description: "Frontend position based on reusable candidate attributes.",
    tags: ["React", "TypeScript"],
    createdAt: "2026-07-12",
    updatedAt: "2026-07-19",
  },
  {
    id: "backend-developer",
    name: "Backend Developer",
    description: "Backend position for Node.js and database experience.",
    tags: ["Node.js", "PostgreSQL"],
    createdAt: "2026-07-10",
    updatedAt: "2026-07-18",
  },
  {
    id: "qa-engineer",
    name: "QA Engineer",
    description: "Quality assurance position for web applications.",
    tags: ["Testing", "Web"],
    createdAt: "2026-07-08",
    updatedAt: "2026-07-16",
  },
  {
    id: "ux-designer",
    name: "UX Designer",
    description: "Product design position focused on clear and reusable web interfaces.",
    tags: ["Figma", "Research"],
    createdAt: "2026-07-15",
    updatedAt: "2026-07-20",
  },
];
