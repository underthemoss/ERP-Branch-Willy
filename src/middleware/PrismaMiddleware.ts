import { PrismaClient } from "@prisma/client";
import { Middleware } from "express-zod-api";
import { z } from "zod";

const prisma = new PrismaClient({});
export const prismaMiddleware = new Middleware({
  input: z.object({}),
  handler: async ({ request, logger }) => {
    return { prisma };
  },
});
