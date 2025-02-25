import { ContentTypesConfig } from "../../../prisma/generated/mongo";

const traverseAncestors = (
  typeId: string,
  configLookup: { [k: string]: ContentTypesConfig["types"][number] }
): ContentTypesConfig["types"][number][] => {
  const ct = configLookup[typeId];
  if (!ct) return [];
  return [...traverseAncestors(ct.parent_id, configLookup), ct];
};

const traverseDescendants = (
  typeId: string,
  configLookup: { [k: string]: ContentTypesConfig["types"][number] }
): ContentTypesConfig["types"][number][] => {
  const ct = configLookup[typeId];
  const children = Object.values(configLookup).filter(
    ({ parent_id }) => parent_id === ct.id
  );
  if (!ct) return [];
  return [
    ...children,
    ...children.flatMap((c) => traverseDescendants(c.id, configLookup)),
  ];
};

export type ContentTypesConfigDenormalised = Awaited<
  ReturnType<typeof denormaliseConfig>
>;

export const denormaliseConfig = (config: ContentTypesConfig) => {
  const contentTypeLookup = Object.fromEntries(
    config.types.map((type) => [type.id, type])
  );

  const denormalisedTypes = config.types
    .map((type) => {
      const ancestors = traverseAncestors(type.parent_id, contentTypeLookup);
      const descendants = traverseDescendants(type.id, contentTypeLookup);
      const inheritedFields = ancestors.flatMap((ct) =>
        ct.fields.map((field) => ({
          ...field,
          contentType: contentTypeLookup[ct.id],
        }))
      );
      const allFields = [
        ...inheritedFields,
        ...type.fields.map((field) => ({
          ...field,
          contentType: type,
        })),
      ];
      return {
        ...type,
        computed: {
          depth: ancestors.length,
          ancestors,
          descendants,
          inheritedFields,
          allFields,
          parentType: contentTypeLookup[type.parent_id],
        },
      };
    })
    .map((type, _, all) => {
      const lookup = Object.fromEntries(all.map((ct) => [ct.id, ct]));
      const creatableChildTypes = type.allowed_child_content_types
        .flatMap((id) => [
          contentTypeLookup[id],
          ...(lookup[id]?.computed.descendants || []),
        ])
        .filter((ct) => !ct.abstract);
      return {
        ...type,
        computed: {
          ...type.computed,
          creatableChildTypes,
        },
      };
    });

  const depthFirstTraversal = (
    node: (typeof denormalisedTypes)[number]
  ): typeof denormalisedTypes => {
    return [
      node,
      ...denormalisedTypes
        .filter((t) => t.parent_id === node.id)
        .flatMap(depthFirstTraversal),
    ];
  };

  const orderedTypes = depthFirstTraversal(
    denormalisedTypes.find((t) => !t.parent_id)!
  );
  return orderedTypes;
};
