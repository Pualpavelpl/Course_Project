import type {
  AttributeCategory,
  AttributeType,
} from "../../generated/prisma/client.js";
import { getPagination } from "../../shared/http/pagination.js";
import { AppError } from "../../shared/errors/app-error.js";
import {
  countAttributeOptionUsages,
  createAttribute as createAttributeRecord,
  deleteAttribute as deleteAttributeRecord,
  findAttributeById,
  findAttributeDeletionState,
  findAttributes,
  updateAttribute as updateAttributeRecord,
} from "./attribute.repository.js";
import type {
  CreateAttributeRequest,
  ListAttributesRequest,
  UpdateAttributeRequest,
} from "./attribute.validation.js";

interface NormalizedAttributeFields {
  name: string;
  description: string;
  type: AttributeType;
  category: AttributeCategory;
  options: string[];
}

function createAttributeNotFoundError(): AppError {
  return new AppError(404, "ATTRIBUTE_NOT_FOUND", "Attribute not found");
}

function createAttributeNameConflictError(): AppError {
  return new AppError(
    409,
    "ATTRIBUTE_NAME_CONFLICT",
    "An Attribute with this name already exists",
  );
}

function normalizeOptions(options: string[] | undefined): string[] {
  return options?.map((option) => option.trim()) ?? [];
}

function validateOptions(type: AttributeType, options?: string[]): string[] {
  if (type !== "SINGLE_SELECT" && options !== undefined) {
    throw new AppError(
      400,
      "ATTRIBUTE_OPTIONS_NOT_ALLOWED",
      "Options are allowed only for SINGLE_SELECT Attributes",
    );
  }

  const normalizedOptions = normalizeOptions(options);

  if (
    type === "SINGLE_SELECT" &&
    (normalizedOptions.length === 0 ||
      normalizedOptions.some((option) => option.length === 0))
  ) {
    throw new AppError(
      400,
      "ATTRIBUTE_OPTIONS_REQUIRED",
      "SINGLE_SELECT Attributes require non-empty options",
    );
  }

  const uniqueOptions = new Set(
    normalizedOptions.map((option) => option.toLowerCase()),
  );

  if (uniqueOptions.size !== normalizedOptions.length) {
    throw new AppError(
      400,
      "ATTRIBUTE_OPTIONS_DUPLICATE",
      "Attribute options must be unique",
    );
  }

  return normalizedOptions;
}

function normalizeAttributeFields(
  body: CreateAttributeRequest["body"],
): NormalizedAttributeFields {
  return {
    name: body.name.trim(),
    description: body.description.trim(),
    type: body.type,
    category: body.category,
    options: validateOptions(body.type, body.options),
  };
}

function arraysEqual(first: string[], second: string[]): boolean {
  return (
    first.length === second.length &&
    first.every((value, index) => value === second[index])
  );
}

export async function listAttributes(
  query: ListAttributesRequest["query"],
) {
  const { skip, take } = getPagination(query.page, query.pageSize);
  const result = await findAttributes({
    skip,
    take,
    search: query.search,
    category: query.category,
  });

  return {
    items: result.items,
    pagination: {
      page: query.page,
      pageSize: take,
      total: result.total,
      totalPages: Math.ceil(result.total / take),
    },
  };
}

export async function getAttribute(id: string) {
  const attribute = await findAttributeById(id);

  if (!attribute) {
    throw createAttributeNotFoundError();
  }

  return attribute;
}

export async function createAttribute(
  body: CreateAttributeRequest["body"],
) {
  const result = await createAttributeRecord(
    normalizeAttributeFields(body),
  );

  if (result.status === "name_conflict") {
    throw createAttributeNameConflictError();
  }

  return result.attribute;
}

function validateBuiltinUpdate(
  current: NonNullable<Awaited<ReturnType<typeof findAttributeById>>>,
  body: UpdateAttributeRequest["body"],
): void {
  if (!current.isBuiltin) {
    return;
  }

  const changesProtectedField =
    (body.name !== undefined && body.name.trim() !== current.name) ||
    (body.type !== undefined && body.type !== current.type) ||
    (body.category !== undefined && body.category !== current.category) ||
    body.options !== undefined;

  if (changesProtectedField) {
    throw new AppError(
      409,
      "BUILTIN_ATTRIBUTE_IMMUTABLE",
      "Built-in Attribute structure cannot be changed",
    );
  }
}

export async function updateAttribute(
  id: string,
  body: UpdateAttributeRequest["body"],
) {
  const current = await findAttributeById(id);

  if (!current) {
    throw createAttributeNotFoundError();
  }

  validateBuiltinUpdate(current, body);

  const resultingType = body.type ?? current.type;
  const normalizedOptions =
    body.options === undefined
      ? undefined
      : validateOptions(resultingType, body.options);

  const currentOptions = current.options.map((option) => option.value);
  const optionsToPersist =
    current.type === "SINGLE_SELECT" && resultingType !== "SINGLE_SELECT"
      ? []
      : normalizedOptions;
  const optionsChanged =
    optionsToPersist !== undefined &&
    !arraysEqual(currentOptions, optionsToPersist);

  if (resultingType === "SINGLE_SELECT") {
    validateOptions(
      resultingType,
      optionsToPersist ?? currentOptions,
    );
  }

  if (optionsChanged) {
    const optionUsages = await countAttributeOptionUsages(id);

    if (optionUsages > 0) {
      throw new AppError(
        409,
        "ATTRIBUTE_OPTIONS_IN_USE",
        "Attribute options cannot be changed while they are in use",
      );
    }
  }

  const result = await updateAttributeRecord({
    id,
    version: body.version,
    ...(body.name !== undefined ? { name: body.name.trim() } : {}),
    ...(body.description !== undefined
      ? { description: body.description.trim() }
      : {}),
    ...(body.type !== undefined ? { type: body.type } : {}),
    ...(body.category !== undefined ? { category: body.category } : {}),
    ...(optionsChanged ? { options: optionsToPersist } : {}),
  });

  if (result.status === "not_found") {
    throw createAttributeNotFoundError();
  }

  if (result.status === "version_conflict") {
    throw new AppError(
      409,
      "ATTRIBUTE_VERSION_CONFLICT",
      "Attribute was changed by another request",
    );
  }

  if (result.status === "name_conflict") {
    throw createAttributeNameConflictError();
  }

  return result.attribute;
}

export async function deleteAttribute(id: string): Promise<void> {
  const deletionState = await findAttributeDeletionState(id);

  if (!deletionState) {
    throw createAttributeNotFoundError();
  }

  if (deletionState.isBuiltin) {
    throw new AppError(
      409,
      "BUILTIN_ATTRIBUTE_DELETE_FORBIDDEN",
      "Built-in Attributes cannot be deleted",
    );
  }

  const relationCount =
    deletionState["_count"].profileAttributes +
    deletionState["_count"].positionAttributes +
    deletionState["_count"].accessPositions;

  if (relationCount > 0) {
    throw new AppError(
      409,
      "ATTRIBUTE_IN_USE",
      "Attribute cannot be deleted while it is in use",
    );
  }

  const result = await deleteAttributeRecord(id);

  if (result.status === "not_found") {
    throw createAttributeNotFoundError();
  }

  if (result.status === "relation_conflict") {
    throw new AppError(
      409,
      "ATTRIBUTE_IN_USE",
      "Attribute cannot be deleted while it is in use",
    );
  }
}
