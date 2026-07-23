import {
  demoAttributes,
  demoCandidates,
  demoPositions,
} from "../seed.data.js";
import {
  createNameMap,
  requireRecord,
  type NamedRecord,
  type TransactionClient,
} from "./shared.js";

export async function seedAttributes(
  transaction: TransactionClient,
) {
  await transaction.attribute.createMany({
    data: demoAttributes.map(
      ({ name, description, type, category, isBuiltin }) => ({
        name,
        description,
        type,
        category,
        isBuiltin,
      }),
    ),
    skipDuplicates: true,
  });

  const attributes = await transaction.attribute.findMany({
    where: { name: { in: demoAttributes.map(({ name }) => name) } },
    select: { id: true, name: true, type: true },
  });
  const attributesByName = createNameMap(attributes);

  for (const definition of demoAttributes) {
    const attribute = requireRecord(attributesByName, definition.name);

    if (attribute.type !== definition.type) {
      throw new Error(`Attribute type conflict: ${definition.name}`);
    }
  }

  await transaction.attributeOption.createMany({
    data: demoAttributes.flatMap((definition) => {
      const attribute = requireRecord(
        attributesByName,
        definition.name,
      );

      return definition.options.map((value, sortOrder) => ({
        attributeId: attribute.id,
        value,
        sortOrder,
      }));
    }),
    skipDuplicates: true,
  });

  const options = await transaction.attributeOption.findMany({
    where: {
      attributeId: {
        in: attributes.map(({ id }) => id),
      },
    },
    select: { id: true, attributeId: true, value: true },
  });
  const optionsByAttributeAndValue = new Map(
    options.map((option) => [
      `${option.attributeId}:${option.value}`,
      option,
    ]),
  );

  return { attributesByName, optionsByAttributeAndValue };
}

export async function seedTags(transaction: TransactionClient) {
  const tagNames = [
    ...new Set([
      ...demoPositions.flatMap(
        ({ tagNames: positionTagNames }) => positionTagNames,
      ),
      ...demoCandidates.flatMap(({ project }) => project.tagNames),
    ]),
  ];

  await transaction.tag.createMany({
    data: tagNames.map((name) => ({ name })),
    skipDuplicates: true,
  });

  const tags = await transaction.tag.findMany({
    where: { name: { in: tagNames } },
    select: { id: true, name: true },
  });

  return createNameMap(tags);
}

export async function seedPositions(
  transaction: TransactionClient,
  attributesByName: Map<string, NamedRecord>,
  tagsByName: Map<string, NamedRecord>,
) {
  const positionNames = demoPositions.map(({ name }) => name);
  const existingPositions = await transaction.position.findMany({
    where: { name: { in: positionNames } },
    select: { id: true, name: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const existingNames = new Set(
    existingPositions.map(({ name }) => name),
  );

  await transaction.position.createMany({
    data: demoPositions
      .filter(({ name }) => !existingNames.has(name))
      .map(({ name, description, maxProjects }) => ({
        name,
        description,
        maxProjects,
        isPublic: true,
      })),
  });

  const positions = await transaction.position.findMany({
    where: { name: { in: positionNames } },
    select: { id: true, name: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const positionsByName = createNameMap(
    positions.filter(
      (position, index, records) =>
        records.findIndex(({ name }) => name === position.name) === index,
    ),
  );

  await transaction.positionAttribute.createMany({
    data: demoPositions.flatMap((definition) => {
      const position = requireRecord(
        positionsByName,
        definition.name,
      );

      return definition.attributeNames.map(
        (attributeName, sortOrder) => ({
          positionId: position.id,
          attributeId: requireRecord(
            attributesByName,
            attributeName,
          ).id,
          sortOrder,
        }),
      );
    }),
    skipDuplicates: true,
  });

  await transaction.positionTag.createMany({
    data: demoPositions.flatMap((definition) => {
      const position = requireRecord(
        positionsByName,
        definition.name,
      );

      return definition.tagNames.map((tagName) => ({
        positionId: position.id,
        tagId: requireRecord(tagsByName, tagName).id,
      }));
    }),
    skipDuplicates: true,
  });

  return positionsByName;
}
