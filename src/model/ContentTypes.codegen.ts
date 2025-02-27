import { ContentTypeConfig } from "./ContentTypes.types";
import { contentTypeConfig } from "./ContentTypes.config";
import fs from "fs";

const stringify = (d: any) => JSON.stringify(d);

const traverseDenormalise = (
  type: ContentTypeConfig,
  parent?: ContentTypeConfig,
  lineage: string[] = [],
  cascadedFields?: ContentTypeConfig["fields"] | undefined,
  depth = 0
): string => {
  const { fields, sub_types, ...contentType } = type;
  const allFields = {
    ...cascadedFields,
    ...Object.fromEntries(
      Object.entries(type.fields).map(([key, value]) => [
        key,
        { ...value, source: type.type },
      ])
    ),
  };
  const fieldsAsArray = Object.entries(allFields).map(([key, value]) => {
    return {
      name: key,
      ...value,
    };
  });

  const subTypes = type.sub_types.flatMap((sub_type) =>
    traverseDenormalise(
      sub_type,
      type,
      [...lineage, type.type],
      allFields,
      depth + 1
    )
  );

  const traverseDescendents = (contentType: ContentTypeConfig): string[] => {
    return [
      contentType.type,
      ...contentType.sub_types.flatMap((ct) => traverseDescendents(ct)),
    ];
  };

  const descendants = traverseDescendents(type);

  return [
    `
  ${contentType.type}: {
    type: ${stringify(contentType.type)},
    label: ${stringify(contentType.label)},
    parent: ${
      parent?.type
        ? `${stringify(parent.type)} as ContentTypeKeys`
        : stringify(null)
    },
    allowed_children: ${stringify(
      contentType.allowed_children
    )} as ContentTypeKeys[],
    abstract: ${stringify(contentType.abstract)},
    color: ${stringify(contentType.color)},
    icon: ${stringify(contentType.icon)} as SystemIconTypes,
    depth: ${stringify(depth)},
    lineage: ${stringify(lineage)} as ContentTypeKeys[],
    descendents: ${stringify(descendants)} as ContentTypeKeys[],
    fields: ${stringify(fieldsAsArray)}
  }`,
    ...subTypes,
  ].join(",");
};

const traverseContentTypeDataModel = (
  type: ContentTypeConfig,
  cascadedFields?: ContentTypeConfig["fields"] | undefined
): any => {
  const allFields = { ...cascadedFields, ...type.fields };
  const dataType = Object.entries(allFields)
    .reduce((acc, [name, field]) => {
      return [
        ...acc,
        `${name}${field.required ? "" : "?"}: ${
          field.type === "text" ? "string" : "any"
        };`,
      ];
    }, [] as string[])
    .join("\n\t\t\t\t");

  const ts = `
  | {
      _id: string;
      type: ${JSON.stringify(type.type)};
      tenant_id: string;
      parent_id: string;
      data: {
        ${dataType}
      };
    }`;
  return (
    ts +
    type.sub_types
      .flatMap((t) => traverseContentTypeDataModel(t, allFields))
      .join("")
  );
};

const denormalisedContentTypes = traverseDenormalise(contentTypeConfig);

const flatten = (
  type: ContentTypeConfig,
  depth = 0
): (ContentTypeConfig & { depth: number })[] => {
  return [
    { ...type, depth },
    ...type.sub_types.flatMap((t) => flatten(t, depth + 1)),
  ];
};

const flatContentTypes = flatten(contentTypeConfig);

const result = `
import { SystemIconTypes } from "@/ui/Icons";

/**
 * Keys of all content types
 */
export type ContentTypeKeys = ${flatContentTypes
  .map((c: any) => JSON.stringify(c.type))
  .join(" | ")};

export const ContentTypeViewModelKeyed = {${traverseDenormalise(
  contentTypeConfig
)}
} as const;


/**
 * ContentTypeDataModel - data model for a content type instance
 */
export type ContentTypeDataModel = ${traverseContentTypeDataModel(
  contentTypeConfig
)};


export const isTypeof = (source: ContentTypeKeys, test: ContentTypeKeys) => {
  const ct = ContentTypeViewModelKeyed[source];
  return ct.lineage.includes(test);
};
export const CastContentType = <t extends ContentTypeKeys>(
  entity: ContentTypeDataModel
): Extract<ContentTypeDataModel, { type: t }> => {
  const ct = ContentTypeViewModelKeyed[entity.type];
  return entity as Extract<ContentTypeDataModel, { type: t }>;
};

`;

fs.writeFileSync("./src/model/ContentTypes.generated.ts", result);

// /**
//  * Denormalised view of the content type
//  */
// export const ContentTypeViewModel =
// ${JSON.stringify(denormalisedContentTypes, undefined, 2)};

// /**
//  * Denormalised view of the content type (keyed by type)
//  */
// export const ContentTypeViewModelKeyed =
// ${JSON.stringify(
//   Object.fromEntries(
//     denormalisedContentTypes.map((type: any) => [type.type, type])
//   ),
//   undefined,
//   2
// )} as const;

// /**
//  * ContentTypeDataModel - data model for a content type instance
//  */
// export type ContentTypeDataModel = ${traverseContentTypeDataModel(
//   contentTypeConfig
// )};
