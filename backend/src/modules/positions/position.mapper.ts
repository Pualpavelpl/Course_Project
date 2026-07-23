import type { findPositionById } from "./position.repository.js";

type PositionRecord = NonNullable<
  Awaited<ReturnType<typeof findPositionById>>
>;

function mapPositionBase(position: PositionRecord) {
  return {
    id: position.id,
    name: position.name,
    description: position.description,
    isPublic: position.isPublic,
    maxProjects: position.maxProjects,
    createdAt: position.createdAt,
    updatedAt: position.updatedAt,
    attributes: position.positionAttributes.map(
      ({ attribute, sortOrder }) => ({
        ...attribute,
        sortOrder,
      }),
    ),
    tags: position.positionTags.map(({ tag }) => tag),
    accessRule:
      !position.isPublic &&
      position.accessAttribute &&
      position.accessOperator
        ? {
            attribute: {
              id: position.accessAttribute.id,
              name: position.accessAttribute.name,
              type: position.accessAttribute.type,
            },
            operator: position.accessOperator,
            option: position.accessOption,
            value: position.accessValue,
          }
        : null,
  };
}

export function mapRecruiterPositionDetail(position: PositionRecord) {
  return {
    ...mapPositionBase(position),
    version: position.version,
  };
}

export function mapCandidatePositionDetail(position: PositionRecord) {
  return mapPositionBase(position);
}
