export const requiredProfileAttributes = [
  {
    name: "First Name",
    description: "Candidate first name",
    type: "STRING",
    category: "PERSONAL_INFORMATION",
    isBuiltin: true,
  },
  {
    name: "Last Name",
    description: "Candidate last name",
    type: "STRING",
    category: "PERSONAL_INFORMATION",
    isBuiltin: true,
  },
  {
    name: "Location",
    description: "Candidate city and country",
    type: "STRING",
    category: "PERSONAL_INFORMATION",
    isBuiltin: true,
  },
] as const;

export const requiredProfileAttributeNames = requiredProfileAttributes.map(
  ({ name }) => name,
);
