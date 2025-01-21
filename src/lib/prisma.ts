import _ from "lodash";
import { EntityTypeColumn, PrismaClient } from "../../prisma/generated/mongo";
import { useAuth } from "./auth";
import { SystemEntityTypes } from "./SystemTypes";

const lineage = (entityTypeId: string): string[] => {
  if (!entityTypeId) return [];
  const parentEntityId = entityTypeId.split("_").slice(0, -1).join("_");
  return [entityTypeId, ...lineage(parentEntityId)];
};

const extendedPrismaClient = () => {
  const prisma = new PrismaClient({
    // log: ["query"],
  });
  return prisma.$extends({
    model: {
      entityType: {
        async getAllAttributes<T>(this: T, entityTypeIds: string[]) {
          const { user } = await useAuth();
          const allEntityTypeIds = _.uniq(entityTypeIds.flatMap(lineage));
          const entityTypes = await prisma.entityType.findMany({
            where: {
              tenantId: { in: ["SYSTEM", user.company_id] },
              id: { in: allEntityTypeIds },
            },
            select: {
              name: true,
              id: true,
              columnIds: true,
            },
          });

          const columnIds = _.uniq(entityTypes.flatMap((et) => et.columnIds));

          const columns = await prisma.entityTypeColumn.findMany({
            where: {
              tenantId: { in: ["SYSTEM", user.company_id] },
              id: { in: columnIds },
            },
          });

          const columnsWithSourceEntityType = columnIds
            .map((c) => columns.find((col) => col.id === c)!)
            .map((c) => ({
              ...c,
              sourceEntityTypes: entityTypes.filter((e) =>
                e.columnIds.includes(c.id)
              ),
            }));

          const [nameColumn, everthingElse] = _.partition(
            columnsWithSourceEntityType,
            (c) => c.id === "name"
          );
          return [...nameColumn, ...everthingElse];
        },
      },
    },
  });
};

const globalForPrisma = global as unknown as {
  prisma: ReturnType<typeof extendedPrismaClient>;
};

export const prisma = globalForPrisma.prisma || extendedPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
