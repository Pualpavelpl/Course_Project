import { describe, expect, it } from "vitest";
import {
  compareAttributeValue,
  getAllowedOperators,
  validateAccessRule,
} from "../src/modules/positions/position-access.js";

describe("Position access rules", () => {
  it("returns operators allowed for each Attribute type", () => {
    expect(getAllowedOperators("STRING")).toEqual([
      "EQUALS",
      "NOT_EQUALS",
      "CONTAINS",
    ]);
    expect(getAllowedOperators("NUMBER")).toContain("GREATER_OR_EQUAL");
    expect(getAllowedOperators("SINGLE_SELECT")).toEqual([
      "EQUALS",
      "NOT_EQUALS",
    ]);
  });

  it("rejects an operator that is invalid for the Attribute type", () => {
    const result = validateAccessRule(
      { id: "attribute-id", type: "BOOLEAN", options: [] },
      {
        attributeId: "attribute-id",
        operator: "GREATER_THAN",
        value: "true",
      },
    );

    expect(result.valid).toBe(false);
  });

  it("compares number, string, boolean, and SINGLE_SELECT values", () => {
    expect(
      compareAttributeValue(
        {
          attributeId: "number",
          attributeType: "NUMBER",
          operator: "GREATER_OR_EQUAL",
          optionId: null,
          value: "3",
        },
        { optionId: null, value: "5" },
      ),
    ).toBe(true);
    expect(
      compareAttributeValue(
        {
          attributeId: "string",
          attributeType: "STRING",
          operator: "CONTAINS",
          optionId: null,
          value: "script",
        },
        { optionId: null, value: "TypeScript" },
      ),
    ).toBe(true);
    expect(
      compareAttributeValue(
        {
          attributeId: "boolean",
          attributeType: "BOOLEAN",
          operator: "EQUALS",
          optionId: null,
          value: "true",
        },
        { optionId: null, value: "TRUE" },
      ),
    ).toBe(true);
    expect(
      compareAttributeValue(
        {
          attributeId: "select",
          attributeType: "SINGLE_SELECT",
          operator: "EQUALS",
          optionId: "advanced-option",
          value: null,
        },
        { optionId: "advanced-option", value: null },
      ),
    ).toBe(true);
  });
});
