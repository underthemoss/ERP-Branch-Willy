import { defaultEndpointsFactory, DependsOnMethod } from "express-zod-api";
import { authMiddleware } from "../../middleware/AuthMiddleware";
import { PrismaClient, Prisma } from "@prisma/client";
import { z } from "zod";
import { prismaMiddleware } from "../../middleware/PrismaMiddleware";

const createFolder = defaultEndpointsFactory
  .addMiddleware(authMiddleware)
  .addMiddleware(prismaMiddleware)
  .build({
    method: "post",
    description: "Create folder",
    input: z.object({ name: z.string().trim().min(1), parent_id: z.string() }),
    output: z.object({}),
    handler: async ({ input, options: { user, prisma } }) => {
      const result = await prisma.folder.create({
        data: {
          name: input.name,
          parent_id: input.parent_id,
          created_by: user.user_id,
          updated_by: user.user_id,
          tenant_id: user.company_id,
        },
      });
      return result;
    },
  });
const getChildren = defaultEndpointsFactory
  .addMiddleware(authMiddleware)
  .addMiddleware(prismaMiddleware)
  .build({
    method: "get",
    description: "Get folder children",
    input: z.object({
      folder_id: z.union([z.string().min(1), z.literal("root")]),
    }),
    output: z.object({
      folders: z.array(
        z.object({
          name: z.string(),
          id: z.string(),
          children: z.array(z.object({})),
        })
      ),
    }),
    handler: async ({ input, options: { user, prisma } }) => {
      const result = await prisma.folder.findMany({
        where: {
          parent_id: input.folder_id === "root" ? "" : input.folder_id,
          tenant_id: user.company_id,
        },
        select: {
          name: true,
          id: true,
          children: true,
          documents: true,
        },
      });

      if (!result) throw "Not found";
      return { folders: result };
    },
  });
const getFolderLineage = defaultEndpointsFactory
  .addMiddleware(authMiddleware)
  .addMiddleware(prismaMiddleware)
  .build({
    method: "get",
    description: "Get folders parents",
    input: z.object({ folder_id: z.string().optional() }),
    output: z.object({
      folders: z.array(
        z.object({
          name: z.string(),
          id: z.string(),
        })
      ),
    }),
    handler: async ({ input, options: { user, prisma } }) => {
      const recurseUp = async (
        folder_id: string
      ): Promise<{ id: string; name: string }[]> => {
        if (!folder_id) return [];
        const folder = await prisma.folder.findFirstOrThrow({
          where: {
            id: folder_id,
            tenant_id: user.company_id,
          },
          select: {
            name: true,
            id: true,
            parent_id: true,
          },
        });

        return [...(await recurseUp(folder.parent_id || "")), folder];
      };

      return { folders: await recurseUp(input.folder_id || "") };
    },
  });

const renameFolder = defaultEndpointsFactory
  .addMiddleware(authMiddleware)
  .addMiddleware(prismaMiddleware)
  .build({
    method: "post",
    description: "Rename folder",
    input: z.object({ folder_id: z.string(), name: z.string() }),
    output: z.object({
      name: z.string(),
      id: z.string(),
      parent_id: z.string().optional().nullable(),
    }),
    handler: async ({ input, options: { user, prisma } }) => {
      const folder = await prisma.folder.update({
        where: { id: input.folder_id, tenant_id: user.company_id },
        data: { name: input.name },
      });
      return folder;
    },
  });

const getFolder = defaultEndpointsFactory
  .addMiddleware(authMiddleware)
  .addMiddleware(prismaMiddleware)
  .build({
    method: "get",
    description: "Get folder",
    input: z.object({ folder_id: z.string() }),
    output: z.object({
      id: z.string(),
      name: z.string(),
    }),
    handler: async ({ input, options }) => {
      const prisma = new PrismaClient();
      const folder = await prisma.folder.findFirstOrThrow({
        where: {
          tenant_id: options.user.company_id,
          id: input.folder_id,
        },
      });
      return folder;
    },
  });

export const foldersRoutes = {
  folders: {
    "": new DependsOnMethod({
      post: createFolder,
      get: getFolder,
    }),
    ":folder_id": {
      "": getFolder,
      lineage: getFolderLineage,
      rename: renameFolder,
      children: getChildren,
    },
  },
};
