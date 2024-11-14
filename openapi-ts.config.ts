import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  client: "@hey-api/client-fetch",
  input: "./openapi.yaml",
  output: "./app/src/api/generated",
  // services: {},
  plugins: ["@tanstack/react-query"],
});
