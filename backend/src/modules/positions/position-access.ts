import type {
  AccessOperator,
  AttributeType,
} from "../../generated/prisma/client.js";
import {
  normalizeScalarAttributeValue,
  parseComparableAttributeValue,
} from "../attributes/attribute-value.js";

const equalityOperators = ["EQUALS", "NOT_EQUALS"] as const;
const orderedOperators = [
  ...equalityOperators,
  "GREATER_THAN",
  "GREATER_OR_EQUAL",
  "LESS_THAN",
  "LESS_OR_EQUAL",
] as const;

const allowedOperators: Record<
  AttributeType,
  readonly AccessOperator[]
> = {
  STRING: [...equalityOperators, "CONTAINS"],
  NUMBER: orderedOperators,
  DATE: orderedOperators,
  PERIOD: equalityOperators,
  BOOLEAN: equalityOperators,
  SINGLE_SELECT: equalityOperators,
};

export interface AccessAttribute {
  id: string;
  type: AttributeType;
  options: Array<{ id: string }>;
}

export interface AccessRuleInput {
  attributeId: string;
  operator: AccessOperator;
  optionId?: string | undefined;
  value?: string | undefined;
}

export interface ValidatedAccessRule {
  attributeId: string;
  attributeType: AttributeType;
  operator: AccessOperator;
  optionId: string | null;
  value: string | null;
}

export interface ProfileAccessValue {
  optionId: string | null;
  value: string | null;
}

type AccessRuleValidationResult =
  | { valid: true; rule: ValidatedAccessRule }
  | { valid: false; reason: string };

export function getAllowedOperators(
  attributeType: AttributeType,
): readonly AccessOperator[] {
  return allowedOperators[attributeType];
}

export function validateAccessRule(
  attribute: AccessAttribute,
  input: AccessRuleInput,
): AccessRuleValidationResult {
  if (attribute.id !== input.attributeId) {
    return { valid: false, reason: "Access Attribute does not match" };
  }

  if (!getAllowedOperators(attribute.type).includes(input.operator)) {
    return {
      valid: false,
      reason: "Operator is not allowed for the Attribute type",
    };
  }

  if (attribute.type === "SINGLE_SELECT") {
    if (input.value !== undefined || !input.optionId) {
      return {
        valid: false,
        reason: "SINGLE_SELECT access rules require only optionId",
      };
    }

    if (!attribute.options.some((option) => option.id === input.optionId)) {
      return {
        valid: false,
        reason: "Access option does not belong to the Attribute",
      };
    }

    return {
      valid: true,
      rule: {
        attributeId: attribute.id,
        attributeType: attribute.type,
        operator: input.operator,
        optionId: input.optionId,
        value: null,
      },
    };
  }

  if (input.optionId !== undefined || input.value === undefined) {
    return {
      valid: false,
      reason: "This Attribute type requires only accessValue",
    };
  }

  const value = normalizeScalarAttributeValue(attribute.type, input.value);

  if (value === undefined) {
    return {
      valid: false,
      reason: "Access value is invalid for the Attribute type",
    };
  }

  return {
    valid: true,
    rule: {
      attributeId: attribute.id,
      attributeType: attribute.type,
      operator: input.operator,
      optionId: null,
      value,
    },
  };
}

function compareValues(
  left: number | string | boolean,
  right: number | string | boolean,
  operator: AccessOperator,
): boolean {
  switch (operator) {
    case "EQUALS":
      return left === right;
    case "NOT_EQUALS":
      return left !== right;
    case "GREATER_THAN":
      return left > right;
    case "GREATER_OR_EQUAL":
      return left >= right;
    case "LESS_THAN":
      return left < right;
    case "LESS_OR_EQUAL":
      return left <= right;
    case "CONTAINS":
      return (
        typeof left === "string" &&
        typeof right === "string" &&
        left.toLowerCase().includes(right.toLowerCase())
      );
  }
}

export function compareAttributeValue(
  rule: ValidatedAccessRule,
  profileValue: ProfileAccessValue | null,
): boolean {
  if (!profileValue) {
    return false;
  }

  if (rule.attributeType === "SINGLE_SELECT") {
    if (!profileValue.optionId || !rule.optionId) {
      return false;
    }

    return compareValues(
      profileValue.optionId,
      rule.optionId,
      rule.operator,
    );
  }

  if (profileValue.value === null || rule.value === null) {
    return false;
  }

  const left = parseComparableAttributeValue(
    rule.attributeType,
    profileValue.value,
  );
  const right = parseComparableAttributeValue(
    rule.attributeType,
    rule.value,
  );

  if (left === undefined || right === undefined) {
    return false;
  }

  return compareValues(left, right, rule.operator);
}
