import type { AttributeCategory } from "../../generated/prisma/client.js";
import { AppError } from "../../shared/errors/app-error.js";
import { getPagination } from "../../shared/http/pagination.js";
import {
  validateAttributeValue,
  type AttributeValueInput,
} from "../attributes/attribute-value.js";
import {
  createProfileAttribute as createProfileAttributeRecord,
  deleteProfileAttribute as deleteProfileAttributeRecord,
  findAttributeDefinitions,
  findAvailableProfileAttributes,
  findProfileAttribute,
  findProfileByCandidateId,
  replaceProfileAttributes,
  type ProfileAttributeWrite,
} from "./profile.repository.js";
import type {
  CreateProfileAttributeRequest,
  ListAvailableProfileAttributesRequest,
  UpdateMyProfileRequest,
  UpdateProfileAttributeRequest,
} from "./profile.validation.js";

function createProfileNotFoundError(): AppError {
  return new AppError(404, "PROFILE_NOT_FOUND", "Candidate Profile not found");
}

function createProfileAttributeNotFoundError(): AppError {
  return new AppError(
    404,
    "PROFILE_ATTRIBUTE_NOT_FOUND",
    "Profile Attribute not found",
  );
}

function mapProfileAttribute(
  profileAttribute: NonNullable<
    Awaited<ReturnType<typeof findProfileAttribute>>
  >,
) {
  return {
    id: profileAttribute.id,
    attributeId: profileAttribute.attribute.id,
    name: profileAttribute.attribute.name,
    description: profileAttribute.attribute.description,
    type: profileAttribute.attribute.type,
    category: profileAttribute.attribute.category,
    isBuiltin: profileAttribute.attribute.isBuiltin,
    value: profileAttribute.value,
    optionId: profileAttribute.optionId,
    displayValue:
      profileAttribute.option?.value ?? profileAttribute.value ?? "",
    options: profileAttribute.attribute.options,
    createdAt: profileAttribute.createdAt,
    updatedAt: profileAttribute.updatedAt,
  };
}

function mapProfile(
  profile: NonNullable<
    Awaited<ReturnType<typeof findProfileByCandidateId>>
  >,
) {
  const attributes = profile.profileAttributes.map(mapProfileAttribute);

  return {
    id: profile.id,
    version: profile.version,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    meAttributes: attributes.filter(({ isBuiltin }) => isBuiltin),
    infoAttributes: attributes.filter(({ isBuiltin }) => !isBuiltin),
  };
}

function throwForWriteStatus(
  status: "not_found" | "version_conflict",
): never {
  if (status === "not_found") {
    throw createProfileNotFoundError();
  }

  throw new AppError(
    409,
    "PROFILE_VERSION_CONFLICT",
    "Profile was changed by another request",
  );
}

function ensureUniqueAttributeIds(attributeIds: string[]): void {
  if (new Set(attributeIds).size !== attributeIds.length) {
    throw new AppError(
      400,
      "PROFILE_ATTRIBUTES_DUPLICATE",
      "Profile Attribute ids must be unique",
    );
  }
}

async function normalizeProfileAttributeValues(
  attributes: Array<{ attributeId: string } & AttributeValueInput>,
): Promise<ProfileAttributeWrite[]> {
  const attributeIds = attributes.map(({ attributeId }) => attributeId);
  ensureUniqueAttributeIds(attributeIds);

  const definitions = await findAttributeDefinitions(attributeIds);

  if (definitions.length !== attributeIds.length) {
    throw new AppError(
      400,
      "ATTRIBUTE_NOT_FOUND",
      "One or more Attributes do not exist",
    );
  }

  const definitionsById = new Map(
    definitions.map((definition) => [definition.id, definition]),
  );

  return attributes.map((attributeInput) => {
    const definition = definitionsById.get(attributeInput.attributeId);

    if (!definition) {
      throw new AppError(
        400,
        "ATTRIBUTE_NOT_FOUND",
        "One or more Attributes do not exist",
      );
    }

    const validationResult = validateAttributeValue(
      definition,
      attributeInput,
    );

    if (!validationResult.valid) {
      throw new AppError(
        400,
        "PROFILE_ATTRIBUTE_VALUE_INVALID",
        validationResult.reason,
      );
    }

    return {
      attributeId: attributeInput.attributeId,
      ...validationResult.value,
    };
  });
}

export async function getMyProfile(candidateId: string) {
  const profile = await findProfileByCandidateId(candidateId);

  if (!profile) {
    throw createProfileNotFoundError();
  }

  return mapProfile(profile);
}

export async function listAvailableAttributes(
  candidateId: string,
  query: ListAvailableProfileAttributesRequest["query"],
) {
  const { skip, take } = getPagination(query.page, query.pageSize);
  const result = await findAvailableProfileAttributes({
    candidateId,
    skip,
    take,
    search: query.search,
    category: query.category as AttributeCategory | undefined,
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

export async function updateMyProfile(
  candidateId: string,
  body: UpdateMyProfileRequest["body"],
) {
  const attributes = await normalizeProfileAttributeValues(body.attributes);
  const result = await replaceProfileAttributes(
    candidateId,
    body.version,
    attributes,
  );

  if (result.status !== "updated") {
    throwForWriteStatus(result.status);
  }

  return mapProfile(result.profile);
}

export async function addProfileAttribute(
  candidateId: string,
  body: CreateProfileAttributeRequest["body"],
) {
  const [attribute] = await normalizeProfileAttributeValues([body]);

  if (!attribute) {
    throw new AppError(400, "ATTRIBUTE_NOT_FOUND", "Attribute does not exist");
  }

  const result = await createProfileAttributeRecord(
    candidateId,
    body.version,
    attribute,
  );

  if (result.status === "duplicate") {
    throw new AppError(
      409,
      "PROFILE_ATTRIBUTE_CONFLICT",
      "Profile already contains this Attribute",
    );
  }

  if (result.status !== "created") {
    throwForWriteStatus(result.status);
  }

  return mapProfile(result.profile);
}

export async function updateProfileAttribute(
  candidateId: string,
  attributeId: string,
  body: UpdateProfileAttributeRequest["body"],
) {
  const existing = await findProfileAttribute(candidateId, attributeId);

  if (!existing) {
    throw createProfileAttributeNotFoundError();
  }

  const [attribute] = await normalizeProfileAttributeValues([
    { attributeId, value: body.value, optionId: body.optionId },
  ]);

  if (!attribute) {
    throw createProfileAttributeNotFoundError();
  }

  const result = await replaceProfileAttributes(
    candidateId,
    body.version,
    [attribute],
  );

  if (result.status !== "updated") {
    throwForWriteStatus(result.status);
  }

  return mapProfile(result.profile);
}

export async function removeProfileAttribute(
  candidateId: string,
  attributeId: string,
  version: number,
): Promise<void> {
  const existing = await findProfileAttribute(candidateId, attributeId);

  if (!existing) {
    throw createProfileAttributeNotFoundError();
  }

  if (existing.attribute.isBuiltin) {
    throw new AppError(
      409,
      "BUILTIN_PROFILE_ATTRIBUTE_DELETE_FORBIDDEN",
      "Built-in Profile Attributes cannot be deleted",
    );
  }

  const result = await deleteProfileAttributeRecord(
    candidateId,
    version,
    attributeId,
  );

  if (result.status === "not_found") {
    throw createProfileAttributeNotFoundError();
  }

  if (result.status === "version_conflict") {
    throwForWriteStatus(result.status);
  }
}
