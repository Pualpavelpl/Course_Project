import { AppError } from "../../shared/errors/app-error.js";
import { getPagination } from "../../shared/http/pagination.js";
import { normalizeTagNames } from "../tags/tag-name.js";
import {
  validateAccessRule,
  type AccessRuleInput,
  type ValidatedAccessRule,
} from "./position-access.js";
import { mapRecruiterPositionDetail } from "./position.mapper.js";
import {
  createPosition as createPositionRecord,
  deletePosition as deletePositionRecord,
  findPositionAttributesByIds,
  findPositionById,
  findPositionList,
  updatePosition as updatePositionRecord,
  type PositionWriteInput,
} from "./position.repository.js";
import type {
  CreatePositionRequest,
  ListPositionsRequest,
  UpdatePositionRequest,
} from "./position.validation.js";

type PositionRecord = NonNullable<
  Awaited<ReturnType<typeof findPositionById>>
>;

function createPositionNotFoundError(): AppError {
  return new AppError(404, "POSITION_NOT_FOUND", "Position not found");
}

function validateOrderedAttributeIds(attributeIds: string[]): void {
  if (new Set(attributeIds).size !== attributeIds.length) {
    throw new AppError(
      400,
      "POSITION_ATTRIBUTES_DUPLICATE",
      "Position Attributes must be unique",
    );
  }
}

function mapAccessRuleError(reason: string): AppError {
  return new AppError(400, "INVALID_ACCESS_RULE", reason);
}

function getCurrentAccessRule(
  position: PositionRecord,
): AccessRuleInput | undefined {
  if (
    position.isPublic ||
    !position.accessAttributeId ||
    !position.accessOperator
  ) {
    return undefined;
  }

  return {
    attributeId: position.accessAttributeId,
    operator: position.accessOperator,
    ...(position.accessOptionId
      ? { optionId: position.accessOptionId }
      : {}),
    ...(position.accessValue !== null
      ? { value: position.accessValue }
      : {}),
  };
}

async function resolveAccessRule(
  isPublic: boolean,
  accessRule: AccessRuleInput | undefined,
  attributeIds: string[],
): Promise<ValidatedAccessRule | undefined> {
  if (isPublic) {
    if (accessRule !== undefined) {
      throw mapAccessRuleError(
        "Public Positions cannot contain an access rule",
      );
    }

    return undefined;
  }

  if (!accessRule) {
    throw mapAccessRuleError(
      "Non-public Positions require one access rule",
    );
  }

  const lookupIds = [...new Set([...attributeIds, accessRule.attributeId])];
  const attributes = await findPositionAttributesByIds(lookupIds);
  const foundIds = new Set(attributes.map((attribute) => attribute.id));

  if (attributeIds.some((attributeId) => !foundIds.has(attributeId))) {
    throw new AppError(
      400,
      "POSITION_ATTRIBUTE_NOT_FOUND",
      "One or more Position Attributes do not exist",
    );
  }

  const accessAttribute = attributes.find(
    (attribute) => attribute.id === accessRule.attributeId,
  );

  if (!accessAttribute) {
    throw mapAccessRuleError("Access Attribute does not exist");
  }

  const validationResult = validateAccessRule(
    accessAttribute,
    accessRule,
  );

  if (!validationResult.valid) {
    throw mapAccessRuleError(validationResult.reason);
  }

  return validationResult.rule;
}

async function validatePublicPositionAttributes(
  attributeIds: string[],
): Promise<void> {
  const attributes = await findPositionAttributesByIds(attributeIds);

  if (attributes.length !== attributeIds.length) {
    throw new AppError(
      400,
      "POSITION_ATTRIBUTE_NOT_FOUND",
      "One or more Position Attributes do not exist",
    );
  }
}

async function buildPositionWriteInput(
  body: CreatePositionRequest["body"],
): Promise<PositionWriteInput> {
  validateOrderedAttributeIds(body.attributeIds);

  const accessRule = await resolveAccessRule(
    body.isPublic,
    body.accessRule,
    body.attributeIds,
  );

  if (body.isPublic) {
    await validatePublicPositionAttributes(body.attributeIds);
  }

  return {
    name: body.name.trim(),
    description: body.description.trim(),
    maxProjects: body.maxProjects,
    attributeIds: body.attributeIds,
    tagNames: normalizeTagNames(body.tags),
    isPublic: body.isPublic,
    accessAttributeId: accessRule?.attributeId ?? null,
    accessOperator: accessRule?.operator ?? null,
    accessOptionId: accessRule?.optionId ?? null,
    accessValue: accessRule?.value ?? null,
  };
}

export async function listPositions(
  query: ListPositionsRequest["query"],
) {
  const { skip, take } = getPagination(query.page, query.pageSize);
  const result = await findPositionList({
    skip,
    take,
    search: query.search,
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

export async function getPosition(id: string) {
  const position = await findPositionById(id);

  if (!position) {
    throw createPositionNotFoundError();
  }

  return mapRecruiterPositionDetail(position);
}

export async function createPosition(
  body: CreatePositionRequest["body"],
) {
  const position = await createPositionRecord(
    await buildPositionWriteInput(body),
  );

  return mapRecruiterPositionDetail(position);
}

function buildUpdateBody(
  current: PositionRecord,
  body: UpdatePositionRequest["body"],
): CreatePositionRequest["body"] {
  const isPublic = body.isPublic ?? current.isPublic;
  const currentAccessRule = getCurrentAccessRule(current);

  return {
    name: body.name ?? current.name,
    description: body.description ?? current.description,
    maxProjects: body.maxProjects ?? current.maxProjects,
    attributeIds:
      body.attributeIds ??
      current.positionAttributes.map(
        ({ attribute }) => attribute.id,
      ),
    tags:
      body.tags ??
      current.positionTags.map(({ tag }) => tag.name),
    isPublic,
    ...(isPublic
      ? body.accessRule !== undefined
        ? { accessRule: body.accessRule }
        : {}
      : { accessRule: body.accessRule ?? currentAccessRule }),
  };
}

export async function updatePosition(
  id: string,
  body: UpdatePositionRequest["body"],
) {
  const current = await findPositionById(id);

  if (!current) {
    throw createPositionNotFoundError();
  }

  const writeInput = await buildPositionWriteInput(
    buildUpdateBody(current, body),
  );
  const result = await updatePositionRecord({
    id,
    version: body.version,
    ...writeInput,
  });

  switch (result.status) {
    case "not_found":
      throw createPositionNotFoundError();
    case "version_conflict":
      throw new AppError(
        409,
        "POSITION_VERSION_CONFLICT",
        "Position was changed by another request",
      );
    case "updated":
      return mapRecruiterPositionDetail(result.position);
  }
}

export async function deletePosition(id: string): Promise<void> {
  const result = await deletePositionRecord(id);

  if (result.status === "not_found") {
    throw createPositionNotFoundError();
  }
}
