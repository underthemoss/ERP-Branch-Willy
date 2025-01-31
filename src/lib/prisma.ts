import _ from "lodash";
import { EntityTypeColumn, PrismaClient } from "../../prisma/generated/mongo";
import { getUser } from "./auth";
import { SystemEntityTypes } from "./SystemTypes";

const lineage = (entityTypeId: string): string[] => {
  if (!entityTypeId) return [];
  const parentEntityId = entityTypeId.split("_").slice(0, -1).join("_");
  return [entityTypeId, ...lineage(parentEntityId)];
};

const extendedPrismaClient = () => {
  const prisma = new PrismaClient({
    //  log: ["query"]
  });

  return prisma.$extends({
    query: {
      // $allModels: {
      //   $allOperations({ model, operation, args, query }) {
      //     const start = Date.now(); // Start timing
      //     return query(args).then((result) => {
      //       const end = Date.now(); // End timing
      //       console.log(
      //         `
      //         Query ${model}.${operation} took ${
      //           end - start
      //         }ms ${JSON.stringify(args, undefined, 2)}`
      //       );
      //       return result;
      //     });
      //   },
      // },
    },
    model: {},
  });
};

const globalForPrisma = global as unknown as {
  prisma: ReturnType<typeof extendedPrismaClient>;
};

export const prisma = globalForPrisma.prisma || extendedPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
