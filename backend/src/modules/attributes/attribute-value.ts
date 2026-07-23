import type { AttributeType } from "../../generated/prisma/client.js";

export interface AttributeValueInput {
  value?: string | undefined;
  optionId?: string | undefined;
}

export interface AttributeValueDefinition {
  type: AttributeType;
  options: Array<{ id: string }>;
}

export interface NormalizedAttributeValue {
  value: string | null;
  optionId: string | null;
}

export type AttributeValueValidationResult =
  | { valid: true; value: NormalizedAttributeValue }
  | { valid: false; reason: string };

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const periodPattern =
  /^(\d{4}-\d{2}-\d{2})\/(\d{4}-\d{2}-\d{2})$/;

export function isValidIsoDate(value: string): boolean {
  if (!isoDatePattern.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.valueOf()) &&
    date.toISOString().startsWith(value)
  );
}

function normalizeTextValue(value: string | undefined): string | undefined {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : undefined;
}

export function normalizeScalarAttributeValue(
  type: Exclude<AttributeType, "SINGLE_SELECT">,
  inputValue: string | undefined,
): string | undefined {
  const value = normalizeTextValue(inputValue);

  if (!value || value.length > 1_000) {
    return undefined;
  }

  if (type === "NUMBER") {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? String(numberValue) : undefined;
  }

  if (type === "BOOLEAN") {
    const booleanValue = value.toLowerCase();
    return booleanValue === "true" || booleanValue === "false"
      ? booleanValue
      : undefined;
  }

  if (type === "DATE") {
    return isValidIsoDate(value) ? value : undefined;
  }

  if (type === "PERIOD") {
    const periodMatch = periodPattern.exec(value);

    if (
      !periodMatch?.[1] ||
      !periodMatch[2] ||
      !isValidIsoDate(periodMatch[1]) ||
      !isValidIsoDate(periodMatch[2]) ||
      periodMatch[2] < periodMatch[1]
    ) {
      return undefined;
    }
  }

  return value;
}

export function validateAttributeValue(
  attribute: AttributeValueDefinition,
  input: AttributeValueInput,
): AttributeValueValidationResult {
  if (attribute.type === "SINGLE_SELECT") {
    if (input.value !== undefined || !input.optionId) {
      return {
        valid: false,
        reason: "SINGLE_SELECT requires only optionId",
      };
    }

    if (!attribute.options.some((option) => option.id === input.optionId)) {
      return {
        valid: false,
        reason: "Option does not belong to the Attribute",
      };
    }

    return {
      valid: true,
      value: { value: null, optionId: input.optionId },
    };
  }

  if (input.optionId !== undefined || input.value === undefined) {
    return {
      valid: false,
      reason: "This Attribute type requires only value",
    };
  }

  const value = normalizeScalarAttributeValue(attribute.type, input.value);

  if (value === undefined) {
    return {
      valid: false,
      reason: "Value is invalid for the Attribute type",
    };
  }

  return {
    valid: true,
    value: { value, optionId: null },
  };
}

export function parseComparableAttributeValue(
  type: AttributeType,
  value: string,
): number | string | boolean | undefined {
  if (type === "NUMBER") {
    const parsedNumber = Number(value);
    return Number.isFinite(parsedNumber) ? parsedNumber : undefined;
  }

  if (type === "DATE") {
    return isValidIsoDate(value)
      ? new Date(`${value}T00:00:00.000Z`).valueOf()
      : undefined;
  }

  if (type === "BOOLEAN") {
    const normalizedValue = value.toLowerCase();

    if (normalizedValue === "true") return true;
    if (normalizedValue === "false") return false;
    return undefined;
  }

  return value;
}
