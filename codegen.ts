import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./schema.graphql",
  documents: ["src/**/*.tsx", "src/**/*.ts"],

  generates: {
    "./src/graphql/hooks.tsx": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",
      ],
      config: {
        withComponent: true,
        withMutationFn: true,
      },
    },
    "./src/graphql/": {
      preset: "client",
      plugins: [],
      config: {},
    },
  },
};
export default config;
