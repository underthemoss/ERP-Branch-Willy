import _ from "lodash";
import {
  PrismaClient,
  Prisma,
  EntityAttributeValueType,
} from "../../prisma/generated/mongo";
import { useAuth } from "./auth";

const extendedPrismaClient = () => {
  const prisma = new PrismaClient({
    // log: ["query"],
  });
  return prisma.$extends({
    model: {
      entityType: {
        async getAllAttributes<T>(this: T, entityTypeIds: string[]) {
          const { user } = await useAuth();

          const entityTypes = await prisma.entityType.findMany({
            where: {
              tenantId: { in: ["SYSTEM", user.company_id] },
            },
          });
          const entityTypeKeyedById = _.keyBy(entityTypes, (d) => d.id);

          const recurseUp = (
            entityTypeId: string
          ): {
            key: string;
            label: string;
            isRequired: boolean;
            type: EntityAttributeValueType;
            entityTypeId: string;
            entityTypeName: string;
          }[] => {
            if (entityTypeId === "") return [];
            const parentEntityId = entityTypeId
              .split("_")
              .slice(0, -1)
              .join("_");
            const entityType = entityTypeKeyedById[entityTypeId];
            return [
              ...recurseUp(parentEntityId),
              ...entityTypeKeyedById[entityTypeId].attributes.map((attrs) => ({
                ...attrs,
                entityTypeId: entityType.id,
                entityTypeName: entityType.name,
              })),
            ];
          };

          return entityTypeIds.flatMap((id) => recurseUp(id));
        },
        // async getAllowedChildContentTypes<T>(
        //   this: T,
        //   entityTypeId: string | undefined
        // ) {
        //   if (!entityTypeId) {
        //     return [];
        //   }
        //   const { user } = await useAuth();
        //   const traveseDown = async (contentTypeId: string) => {
        //     const base = await prisma.entityType.findFirstOrThrow({
        //       where: {
        //         tenantId: { in: ["SYSTEM", user.company_id] },
        //         id: contentTypeId,
        //       },
        //       select: {
        //         id: true,
        //         name: true,
        //         children: {
        //           select: {
        //             id: true,
        //             name: true,
        //           },
        //         },
        //       },
        //     });
        //   };
        //   return await traveseDown(entityTypeId);
        // },
      },
    },
  });
};

const globalForPrisma = global as unknown as {
  prisma: ReturnType<typeof extendedPrismaClient>;
};

export const prisma = globalForPrisma.prisma || extendedPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
