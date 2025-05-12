import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema:
    process.env.NEXT_PUBLIC_GQL_URL ||
    "https://staging-api.equipmentshare.com/es-erp-api/graphql",
  generates: {
    "./schema.graphql": {
      plugins: ["schema-ast"],
    },
  },
};
export default config;
