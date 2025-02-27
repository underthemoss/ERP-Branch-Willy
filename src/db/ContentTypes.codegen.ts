//
import { contentTypeConfig, ContentTypeConfig } from "./ContenTypes.config";
import fs from "fs";

const traverseDenormalise = (
  type: ContentTypeConfig,
  parent?: ContentTypeConfig,
  lineage: string[] = [],
  cascadedFields?: ContentTypeConfig["fields"] | undefined,
  depth = 0
): any => {
  const { fields, sub_types, ...rest } = type;
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

  return [
    {
      ...rest,
      parent: parent?.type || null,
      depth,
      lineage,
      fields: fieldsAsArray,
      descendants: subTypes.map((s) => s.type),
    },
    ...subTypes,
  ];
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

const result = `

export type ContentTypeKeys = ${denormalisedContentTypes
  .map((c: any) => JSON.stringify(c.type))
  .join(" | ")};

export const ContentTypeViewModel = 
${JSON.stringify(denormalisedContentTypes, undefined, 2)};

export const ContentTypeViewModelKeyed = 
${JSON.stringify(
  Object.fromEntries(
    denormalisedContentTypes.map((type: any) => [type.type, type])
  ),
  undefined,
  2
)} as const;

export type ContentTypeDataModel = ${traverseContentTypeDataModel(
  contentTypeConfig
)};

`;

fs.writeFileSync("./src/db/ContentTypes.generated.ts", result);
