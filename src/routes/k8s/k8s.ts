import { DependsOnMethod, defaultEndpointsFactory } from "express-zod-api";
import { z } from "zod";

const readyzEndpoint = defaultEndpointsFactory.build({
  method: "get",
  description: "Readiness",
  input: z.object({}),
  output: z.object({}),
  handler: async () => {
    return {};
  },
});

export const k8sRoutes = {
  readyz: readyzEndpoint,
};
