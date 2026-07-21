export const attributeCategories = [
  "Personal Information",
  "Certification",
  "Domain Knowledge",
  "Soft Skills",
] as const;

export const attributeTypes = [
  "String",
  "Text",
  "Image",
  "Numeric",
  "Date",
  "Period",
  "Boolean",
  "One of many",
] as const;

export interface AttributeListItem {
  id: string;
  name: string;
  description: string;
  type: (typeof attributeTypes)[number];
  category: (typeof attributeCategories)[number];
  createdAt: string;
  updatedAt: string;
}

export const initialAttributes: AttributeListItem[] = [
  {
    id: "location",
    name: "Location",
    description: "Candidate location",
    type: "String",
    category: "Personal Information",
    createdAt: "2026-07-08",
    updatedAt: "2026-07-18",
  },
  {
    id: "ielts-score",
    name: "IELTS Score",
    description: "English language certification score",
    type: "Numeric",
    category: "Certification",
    createdAt: "2026-07-10",
    updatedAt: "2026-07-19",
  },
  {
    id: "presentation-skills",
    name: "Presentation Skills",
    description: "Candidate presentation skill level",
    type: "One of many",
    category: "Soft Skills",
    createdAt: "2026-07-12",
    updatedAt: "2026-07-20",
  },
];
