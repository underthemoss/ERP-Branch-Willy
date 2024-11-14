import { DependsOnMethod, defaultEndpointsFactory } from "express-zod-api";
import { z } from "zod";

const readyzEndpoint = defaultEndpointsFactory.build({
  method: "get",
  description: "Readiness",
  input: z.object({}),
  output: z.object({ status: z.string() }),
  handler: async ({ input, logger, options: { user, bearerToken } }) => {
    return { status: "OK" };
  },
});

export const k8sRoutes = {
  readyz: readyzEndpoint,
};
