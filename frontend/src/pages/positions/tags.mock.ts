export interface TagListItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export const initialTags: TagListItem[] = [
  { id: "react", name: "React", createdAt: "2026-07-08", updatedAt: "2026-07-20" },
  { id: "typescript", name: "TypeScript", createdAt: "2026-07-09", updatedAt: "2026-07-19" },
  { id: "nodejs", name: "Node.js", createdAt: "2026-07-10", updatedAt: "2026-07-18" },
  { id: "postgresql", name: "PostgreSQL", createdAt: "2026-07-11", updatedAt: "2026-07-17" },
];
