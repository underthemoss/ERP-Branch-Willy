
import type { CodegenConfig } from "@graphql-codegen/cli";


const config: CodegenConfig = {
  schema: "https://staging-api.equipmentshare.com/es-erp-api/graphql", // Replace with your GraphQL endpoint
  generates: {
    "./schema.graphql": {
      plugins: ["schema-ast"],
    },
  },
};
export default config;
