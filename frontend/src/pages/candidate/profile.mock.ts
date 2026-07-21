import type { AttributeListItem } from "../attributes/attributes.mock";

export interface ProfileAttributeListItem {
  id: string;
  name: string;
  value: string;
  category: AttributeListItem["category"];
}

export interface ProjectListItem {
  id: string;
  name: string;
  period: string;
  description: string;
  tags: string[];
}

export const meAttributes: ProfileAttributeListItem[] = [
  { id: "first-name", name: "First name", value: "Anna", category: "Personal Information" },
  { id: "last-name", name: "Last name", value: "Kowalska", category: "Personal Information" },
  { id: "location", name: "Location", value: "Warsaw", category: "Personal Information" },
];

export const initialInfoAttributes: ProfileAttributeListItem[] = [
  { id: "ielts-score", name: "IELTS Score", value: "7.5", category: "Certification" },
  {
    id: "presentation-skills",
    name: "Presentation Skills",
    value: "Advanced",
    category: "Soft Skills",
  },
  {
    id: "react-knowledge",
    name: "React Knowledge",
    value: "Advanced",
    category: "Domain Knowledge",
  },
];

export const initialProjects: ProjectListItem[] = [
  {
    id: "recruitment-platform",
    name: "Recruitment platform",
    period: "2026-02 — present",
    description:
      "A reusable recruitment platform where candidate profile attributes are assembled dynamically into position-specific CVs. The project includes template configuration, reusable data fields and responsive interfaces.",
    tags: ["React", "TypeScript"],
  },
  {
    id: "task-manager",
    name: "Task manager",
    period: "2025-09 — 2026-01",
    description: "A compact task management application with filtering and team assignments.",
    tags: ["Node.js", "PostgreSQL"],
  },
];
