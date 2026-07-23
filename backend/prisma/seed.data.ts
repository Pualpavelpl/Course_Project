import type {
  AttributeCategory,
  AttributeType,
} from "../src/generated/prisma/client.js";

interface DemoAttribute {
  name: string;
  description: string;
  type: AttributeType;
  category: AttributeCategory;
  isBuiltin: boolean;
  options: string[];
}

interface DemoPosition {
  name: string;
  description: string;
  maxProjects: number;
  attributeNames: string[];
  tagNames: string[];
}

interface DemoProject {
  name: string;
  periodStart: string;
  periodEnd: string | null;
  description: string;
  tagNames: string[];
}

interface DemoCandidate {
  email: string;
  fullName: string;
  location: string;
  experienceYears: string;
  englishLevel: string;
  collaborationStyle: string;
  positionName: string;
  project: DemoProject;
}

export const demoAttributes: DemoAttribute[] = [
  {
    name: "Full name",
    description: "Candidate name shown in the CV header",
    type: "STRING",
    category: "PERSONAL_INFORMATION",
    isBuiltin: true,
    options: [],
  },
  {
    name: "Location",
    description: "Candidate city and country",
    type: "STRING",
    category: "PERSONAL_INFORMATION",
    isBuiltin: false,
    options: [],
  },
  {
    name: "Years of professional experience",
    description: "Completed years of relevant professional experience",
    type: "NUMBER",
    category: "DOMAIN_KNOWLEDGE",
    isBuiltin: false,
    options: [],
  },
  {
    name: "English proficiency",
    description: "English level based on the CEFR scale",
    type: "SINGLE_SELECT",
    category: "DOMAIN_KNOWLEDGE",
    isBuiltin: false,
    options: ["A2", "B1", "B2", "C1", "C2"],
  },
  {
    name: "Collaboration style",
    description: "How the candidate works with teammates and stakeholders",
    type: "STRING",
    category: "SOFT_SKILLS",
    isBuiltin: false,
    options: [],
  },
];

const profileAttributeNames = demoAttributes.map(({ name }) => name);

export const demoPositions: DemoPosition[] = [
  {
    name: "Frontend Developer",
    description:
      "Build accessible, responsive product interfaces with React and TypeScript.",
    maxProjects: 3,
    attributeNames: profileAttributeNames,
    tagNames: ["react", "typescript", "css"],
  },
  {
    name: "Backend Developer",
    description:
      "Design reliable Node.js services and data access layers for PostgreSQL.",
    maxProjects: 3,
    attributeNames: profileAttributeNames,
    tagNames: ["node.js", "typescript", "postgresql"],
  },
  {
    name: "Full-Stack Developer",
    description:
      "Deliver end-to-end web features across React clients and Node.js APIs.",
    maxProjects: 4,
    attributeNames: profileAttributeNames,
    tagNames: ["react", "node.js", "postgresql"],
  },
  {
    name: "QA Automation Engineer",
    description:
      "Create maintainable automated tests for web applications and APIs.",
    maxProjects: 3,
    attributeNames: profileAttributeNames,
    tagNames: ["testing", "playwright", "typescript"],
  },
  {
    name: "DevOps Engineer",
    description:
      "Improve delivery pipelines, cloud infrastructure, and service reliability.",
    maxProjects: 3,
    attributeNames: profileAttributeNames,
    tagNames: ["docker", "aws", "postgresql"],
  },
];

export const demoCandidates: DemoCandidate[] = [
  {
    email: "alice.morgan.demo@example.com",
    fullName: "Alice Morgan",
    location: "London, United Kingdom",
    experienceYears: "4",
    englishLevel: "C1",
    collaborationStyle:
      "Facilitates design reviews and documents decisions clearly.",
    positionName: "Frontend Developer",
    project: {
      name: "Customer Analytics Dashboard",
      periodStart: "2023-02-01",
      periodEnd: "2024-04-30",
      description:
        "Built an accessible React dashboard with reusable data visualization components.",
      tagNames: ["react", "typescript", "css"],
    },
  },
  {
    email: "daniel.kim.demo@example.com",
    fullName: "Daniel Kim",
    location: "Toronto, Canada",
    experienceYears: "6",
    englishLevel: "C1",
    collaborationStyle:
      "Pairs with engineers and turns operational feedback into small improvements.",
    positionName: "Backend Developer",
    project: {
      name: "Order Processing API",
      periodStart: "2022-06-01",
      periodEnd: "2024-12-31",
      description:
        "Designed a transactional Node.js API backed by PostgreSQL and automated observability.",
      tagNames: ["node.js", "typescript", "postgresql"],
    },
  },
  {
    email: "sofia.rossi.demo@example.com",
    fullName: "Sofia Rossi",
    location: "Milan, Italy",
    experienceYears: "5",
    englishLevel: "B2",
    collaborationStyle:
      "Works closely with product teams and communicates delivery risks early.",
    positionName: "Full-Stack Developer",
    project: {
      name: "Subscription Management Portal",
      periodStart: "2023-01-01",
      periodEnd: "2025-03-31",
      description:
        "Delivered subscription workflows across a React application and Node.js services.",
      tagNames: ["react", "node.js", "postgresql"],
    },
  },
  {
    email: "mateo.silva.demo@example.com",
    fullName: "Mateo Silva",
    location: "Lisbon, Portugal",
    experienceYears: "3",
    englishLevel: "B2",
    collaborationStyle:
      "Creates concise test plans and shares actionable defect reports.",
    positionName: "QA Automation Engineer",
    project: {
      name: "Cross-Browser Regression Suite",
      periodStart: "2023-08-01",
      periodEnd: null,
      description:
        "Created a Playwright regression suite covering critical customer journeys.",
      tagNames: ["testing", "playwright", "typescript"],
    },
  },
  {
    email: "emma.wilson.demo@example.com",
    fullName: "Emma Wilson",
    location: "Dublin, Ireland",
    experienceYears: "7",
    englishLevel: "C2",
    collaborationStyle:
      "Coordinates incident reviews and turns findings into measurable platform work.",
    positionName: "DevOps Engineer",
    project: {
      name: "Cloud Delivery Platform",
      periodStart: "2021-05-01",
      periodEnd: "2025-01-31",
      description:
        "Standardized container delivery and cloud environments for multiple product teams.",
      tagNames: ["docker", "aws", "postgresql"],
    },
  },
];
