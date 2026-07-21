export interface AttributeListItem {
  id: string;
  name: string;
  description: string;
  category: "Personal Information" | "Certification" | "Soft Skills";
  createdAt: string;
  updatedAt: string;
}

export const initialAttributes: AttributeListItem[] = [
  {
    id: "location",
    name: "Location",
    description: "Candidate location",
    category: "Personal Information",
    createdAt: "2026-07-08",
    updatedAt: "2026-07-18",
  },
  {
    id: "ielts-score",
    name: "IELTS Score",
    description: "English language certification score",
    category: "Certification",
    createdAt: "2026-07-10",
    updatedAt: "2026-07-19",
  },
  {
    id: "presentation-skills",
    name: "Presentation Skills",
    description: "Candidate presentation skill level",
    category: "Soft Skills",
    createdAt: "2026-07-12",
    updatedAt: "2026-07-20",
  },
];
