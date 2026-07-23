import { AppError } from "../../shared/errors/app-error.js";
import { getPagination } from "../../shared/http/pagination.js";
import {
  findAvailablePositionList,
  findCandidateProfileAttribute,
  findCandidateProfileId,
} from "./candidate-position.repository.js";
import {
  compareAttributeValue,
  validateAccessRule,
  type AccessRuleInput,
} from "./position-access.js";
import { mapCandidatePositionDetail } from "./position.mapper.js";
import { findPositionById } from "./position.repository.js";
import type { ListPositionsRequest } from "./position.validation.js";

function createUnavailablePositionError(): AppError {
  return new AppError(404, "POSITION_NOT_FOUND", "Position not found");
}

export async function listAvailablePositions(
  candidateId: string,
  query: ListPositionsRequest["query"],
) {
  const profile = await findCandidateProfileId(candidateId);

  if (!profile) {
    throw new AppError(
      404,
      "PROFILE_NOT_FOUND",
      "Candidate Profile not found",
    );
  }

  const { skip, take } = getPagination(query.page, query.pageSize);
  const result = await findAvailablePositionList({
    profileId: profile.id,
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

export async function getAvailablePosition(
  candidateId: string,
  positionId: string,
) {
  const position = await findPositionById(positionId);

  if (!position) {
    throw createUnavailablePositionError();
  }

  if (position.isPublic) {
    return mapCandidatePositionDetail(position);
  }

  if (
    !position.accessAttribute ||
    !position.accessOperator ||
    !position.accessAttributeId
  ) {
    throw createUnavailablePositionError();
  }

  const ruleInput: AccessRuleInput = {
    attributeId: position.accessAttributeId,
    operator: position.accessOperator,
    ...(position.accessOptionId
      ? { optionId: position.accessOptionId }
      : {}),
    ...(position.accessValue !== null
      ? { value: position.accessValue }
      : {}),
  };
  const validationResult = validateAccessRule(
    position.accessAttribute,
    ruleInput,
  );

  if (!validationResult.valid) {
    throw createUnavailablePositionError();
  }

  const profileValue = await findCandidateProfileAttribute(
    candidateId,
    position.accessAttributeId,
  );

  if (!compareAttributeValue(validationResult.rule, profileValue)) {
    throw createUnavailablePositionError();
  }

  return mapCandidatePositionDetail(position);
}
