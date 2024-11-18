import { DependsOnMethod, defaultEndpointsFactory } from "express-zod-api";
import { z } from "zod";
import { authMiddleware } from "../../middleware/AuthMiddleware";

const readyzEndpoint = defaultEndpointsFactory
  .addMiddleware(authMiddleware)
  .build({
    method: "get",
    description: "Readiness",
    input: z.object({}),
    output: z.object({
      user: z.string(),
    }),
    handler: async ({ options }) => {
      return {
        user: options.user.user_name,
      };
    },
  });

export const foldersRoutes = {
  folders: {
    command: {
      create: readyzEndpoint,
    },
  },
};
