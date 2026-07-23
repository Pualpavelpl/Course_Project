import { AppError } from "../../shared/errors/app-error.js";
import { getPagination } from "../../shared/http/pagination.js";
import { getAvailablePosition } from "../positions/candidate-position.service.js";
import { updateMyProfile } from "../profiles/profile.service.js";
import {
  createCv as createCvRecord,
  addCvLike as addCvLikeRecord,
  deleteCandidateCv,
  findCandidateCvForAssembly,
  findCandidateCvList,
  findCvAssemblyContent,
  findRecruiterCvList,
  findRecruiterCvForAssembly,
  removeCvLike as removeCvLikeRecord,
} from "./cv.repository.js";
import type {
  CreateCvRequest,
  ListCvsRequest,
  ListRecruiterCvsRequest,
  UpdateCvProfileAttributesRequest,
} from "./cv.validation.js";

type CvAssemblyRecord = NonNullable<
  Awaited<ReturnType<typeof findCandidateCvForAssembly>>
>;

function createCvNotFoundError(): AppError {
  return new AppError(404, "CV_NOT_FOUND", "CV not found");
}

async function assembleCv(cv: CvAssemblyRecord) {
  const positionAttributes = cv.position.positionAttributes;
  const attributeIds = positionAttributes.map(
    ({ attribute }) => attribute.id,
  );
  const tags = cv.position.positionTags.map(({ tag }) => tag);
  const content = await findCvAssemblyContent(
    cv.profile.id,
    attributeIds,
    tags.map(({ id }) => id),
    cv.position.maxProjects,
  );
  const valuesByAttributeId = new Map(
    content.profileAttributes.map((value) => [value.attributeId, value]),
  );

  return {
    id: cv.id,
    createdAt: cv.createdAt,
    updatedAt: cv.updatedAt,
    profile: {
      id: cv.profile.id,
      version: cv.profile.version,
      candidate: cv.profile.candidate,
    },
    position: {
      id: cv.position.id,
      name: cv.position.name,
      description: cv.position.description,
      maxProjects: cv.position.maxProjects,
    },
    attributes: positionAttributes.map(({ sortOrder, attribute }) => {
      const profileValue = valuesByAttributeId.get(attribute.id);

      return {
        id: attribute.id,
        attributeId: attribute.id,
        name: attribute.name,
        description: attribute.description,
        type: attribute.type,
        category: attribute.category,
        isBuiltin: attribute.isBuiltin,
        sortOrder,
        value: profileValue?.value ?? null,
        optionId: profileValue?.optionId ?? null,
        displayValue:
          profileValue?.option?.value ?? profileValue?.value ?? "",
        options: attribute.options,
      };
    }),
    projects: content.projects.map((project) => ({
      id: project.id,
      name: project.name,
      periodStart: project.periodStart.toISOString().slice(0, 10),
      periodEnd: project.periodEnd?.toISOString().slice(0, 10) ?? null,
      description: project.description,
      tags: project.projectTags.map(({ tag }) => tag),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    })),
    tags,
  };
}

export async function createCv(
  candidateId: string,
  body: CreateCvRequest["body"],
) {
  await getAvailablePosition(candidateId, body.positionId);
  const result = await createCvRecord(candidateId, body.positionId);

  if (result.status === "duplicate") {
    throw new AppError(
      409,
      "CV_POSITION_CONFLICT",
      "A CV already exists for this Profile and Position",
    );
  }

  if (result.status === "profile_not_found") {
    throw new AppError(404, "PROFILE_NOT_FOUND", "Candidate Profile not found");
  }

  return result.cv;
}

export async function listCandidateCvs(
  candidateId: string,
  query: ListCvsRequest["query"],
) {
  const { skip, take } = getPagination(query.page, query.pageSize);
  const result = await findCandidateCvList({
    candidateId,
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

export async function getCandidateCv(candidateId: string, cvId: string) {
  const cv = await findCandidateCvForAssembly(candidateId, cvId);

  if (!cv) {
    throw createCvNotFoundError();
  }

  return assembleCv(cv);
}

export async function getRecruiterCv(cvId: string) {
  const cv = await findRecruiterCvForAssembly(cvId);

  if (!cv) {
    throw createCvNotFoundError();
  }

  return assembleCv(cv);
}

export async function listRecruiterCvs(
  recruiterId: string,
  query: ListRecruiterCvsRequest["query"],
) {
  const { skip, take } = getPagination(query.page, query.pageSize);
  const result = await findRecruiterCvList({
    recruiterId,
    skip,
    take,
    search: query.search,
    positionId: query.positionId,
    liked: query.liked,
  });

  return {
    items: result.items.map((cv) => ({
      id: cv.id,
      position: cv.position,
      profile: {
        id: cv.profile.id,
        candidateId: cv.profile.candidate.id,
        email: cv.profile.candidate.email,
      },
      createdAt: cv.createdAt,
      likeCount: cv["_count"].cvLikes,
      likedByCurrentRecruiter: cv.cvLikes.length > 0,
    })),
    pagination: {
      page: query.page,
      pageSize: take,
      total: result.total,
      totalPages: Math.ceil(result.total / take),
    },
  };
}

export async function addCvLike(cvId: string, recruiterId: string) {
  const result = await addCvLikeRecord(cvId, recruiterId);

  if (result.status === "not_found") {
    throw createCvNotFoundError();
  }

  return {
    liked: true,
    likeCount: result.likeCount,
  };
}

export async function removeCvLike(
  cvId: string,
  recruiterId: string,
): Promise<void> {
  const result = await removeCvLikeRecord(cvId, recruiterId);

  if (result.status === "not_found") {
    throw createCvNotFoundError();
  }
}

export async function updateCvProfileAttributes(
  candidateId: string,
  cvId: string,
  body: UpdateCvProfileAttributesRequest["body"],
) {
  const cv = await findCandidateCvForAssembly(candidateId, cvId);

  if (!cv) {
    throw createCvNotFoundError();
  }

  const allowedAttributeIds = new Set(
    cv.position.positionAttributes.map(
      ({ attribute }) => attribute.id,
    ),
  );

  if (
    body.attributes.some(
      ({ attributeId }) => !allowedAttributeIds.has(attributeId),
    )
  ) {
    throw new AppError(
      400,
      "CV_ATTRIBUTE_NOT_IN_TEMPLATE",
      "CV can update only Attributes from its Position template",
    );
  }

  await updateMyProfile(candidateId, body);
  return getCandidateCv(candidateId, cvId);
}

export async function deleteCv(
  candidateId: string,
  cvId: string,
): Promise<void> {
  const result = await deleteCandidateCv(candidateId, cvId);

  if (result.status === "not_found") {
    throw createCvNotFoundError();
  }
}
