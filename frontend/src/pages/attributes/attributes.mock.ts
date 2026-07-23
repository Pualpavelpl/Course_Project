import type {
  AttributeCategory,
  AttributeType,
} from "./attributes.api";

export interface AttributeListItem {
  id: string;
  name: string;
  description: string;
  type: AttributeType;
  category: AttributeCategory;
  createdAt: string;
  updatedAt: string;
}

export const initialAttributes: AttributeListItem[] = [
  {
    id: "location",
    name: "Location",
    description: "Candidate location",
    type: "STRING",
    category: "PERSONAL_INFORMATION",
    createdAt: "2026-07-08",
    updatedAt: "2026-07-18",
  },
  {
    id: "ielts-score",
    name: "IELTS Score",
    description: "English language certification score",
    type: "NUMBER",
    category: "CERTIFICATION",
    createdAt: "2026-07-10",
    updatedAt: "2026-07-19",
  },
  {
    id: "presentation-skills",
    name: "Presentation Skills",
    description: "Candidate presentation skill level",
    type: "SINGLE_SELECT",
    category: "SOFT_SKILLS",
    createdAt: "2026-07-12",
    updatedAt: "2026-07-20",
  },
  {
    id: "remote-work",
    name: "Remote Work Availability",
    description: "Whether the candidate is available for remote work",
    type: "BOOLEAN",
    category: "PERSONAL_INFORMATION",
    createdAt: "2026-07-13",
    updatedAt: "2026-07-20",
  },
  {
    id: "github-profile",
    name: "GitHub Profile",
    description: "Link to the candidate GitHub profile",
    type: "STRING",
    category: "DOMAIN_KNOWLEDGE",
    createdAt: "2026-07-14",
    updatedAt: "2026-07-20",
  },
  {
    id: "teamwork",
    name: "Teamwork",
    description: "Candidate teamwork skill level",
    type: "SINGLE_SELECT",
    category: "SOFT_SKILLS",
    createdAt: "2026-07-15",
    updatedAt: "2026-07-20",
  },
];
