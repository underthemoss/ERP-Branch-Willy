import { createGenerator } from "ts-json-schema-generator";
import fs from "fs";
import { format } from "prettier";
import { JSONSchema7 } from "json-schema";

const main = async () => {
  if (!fs.existsSync("./generated")) {
    fs.mkdirSync("./generated/");
  }
  const schema = createGenerator({
    path: "./DataModelConfig.ts",
  }).createSchema("*");
  fs.writeFileSync(
    "./generated/schema.json",
    JSON.stringify(schema, undefined, 2)
  );
  const types = Object.fromEntries(
    Object.entries(schema.definitions || {}).map(([type, def]) => [
      type,
      def as JSONSchema7,
    ])
  );

  // const traverseFields = (schema: JSONSchema7, parent: string[] = []): any => {
  //   if (schema.type === "object") {
  //     return Object.entries(schema.properties || {}).map(([key, value]) =>
  //       traverseFields(value as JSONSchema7, [...parent, key])
  //     );
  //   }
  //   if (schema.type === "string") {
  //     return [parent, "string"];
  //   }
  //   // if (schema.type === "array") {
  //   //   return [parent, "array"];
  //   // }
  //   return [];
  // };

  // const allFields = Object.entries(types).flatMap(([name, type]) =>
  //   traverseFields(type)
  // );
  // console.log(JSON.stringify(allFields, undefined, 2));

  fs.writeFileSync(
    "./generated/content-types.ts",
    await format(
      `// AUTO GENERATED
      import { ${Object.keys(types)
        .map((t) => t)
        .join(" , ")} } from '../DataModelConfig'

      export type ContentTypeDataModel = ${Object.keys(types)
        .map((t) => t)
        .join(" | ")}


      export type IFieldRenderLookup = {
          ${Object.entries(types).map(([typeName, typeDef]) => {
            const name = (typeDef as any).properties.type.const;
            const fields = (typeDef.properties as any).data.properties as {
              [k: string]: JSONSchema7;
            };

            const topLevelKeys = Object.keys(typeDef.properties || {}).filter(
              (k) => k !== "data"
            );
            return `
             ${name}: {
               ${topLevelKeys
                 .map((k) => `${k}: React.FC<{ value: ${typeName}['${k}'] }>;`)
                 .join("")}
               ${Object.entries(fields)
                 .map(
                   ([fieldName]) =>
                     `['data.${fieldName}']: React.FC<{ value: ${typeName}['data']['${fieldName}'] }>;`
                 )
                 .join("")}
             }`;
          })}
       }

      export type HeaderConfig = { width: number; label: string; };
      export type IHeaderRenderLookup = {
         ${[
           ...new Set(
             Object.entries(types).flatMap(([typeName, typeDef]) => {
               const fields = Object.keys(
                 (typeDef.properties as any).data.properties
               ).map((k) => `data.${k}`);
               const topLevelKeys = Object.keys(
                 typeDef.properties || {}
               ).filter((k) => k !== "data");
               return [...fields, ...topLevelKeys];
             })
           ),
         ]
           .map((k) => {
             return `'${k}': HeaderConfig;`;
           })
           .join("")}
      }


      export interface GridPosition { x: number; y: number; w: number; h: number };
      
      export interface UIForm<Fields extends string> {
        title: "asset" | string;
        subtitle: "asset" | string;
        fields: {
          [field in Fields]: {
            field_type: "text" | "number";
            title: string;
            position: GridPosition | null;
          } | null;
        };
      }

      export interface UIConfigInterface {
        ${Object.entries(types)
          .map(([typeName, typeDef]) => {
            const fields = (typeDef.properties as any).data.properties as {
              [k: string]: JSONSchema7;
            };
            const name = (typeDef as any).properties.type.const;
            const formTypeDef = `UIForm<${Object.keys(fields)
              .map((k) => `'${k}'`)
              .join("|")}>`;
            return `
              ${name} : {
                primary_display_field: ${
                  Object.keys(fields)
                    .map((k) => `'${k}'`)
                    .join("|") || null
                };
                create_form: ${formTypeDef};
                edit_form: ${formTypeDef};
                display_page: ${formTypeDef};
              }
            `;
          })
          .join("")}
      }
      
   

      `,
      { parser: "typescript" }
    )
  );
};

main();
setTimeout(() => {}, 10000000);
