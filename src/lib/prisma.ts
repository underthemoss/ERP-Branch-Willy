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
        async getAllAttributes<T>(this: T, entityTypeId: string) {
          const { user } = await useAuth();

          const recurseUp = async (
            entityTypeId: string | null
          ): Promise<
            {
              key: string;
              label: string;
              type: EntityAttributeValueType;
              entityTypeId: string;
              entityTypeName: string;
              isRequired: boolean;
            }[]
          > => {
            if (entityTypeId === null) return [];

            const result = await prisma.entityType.findFirstOrThrow({
              where: {
                id: entityTypeId,
                tenantId: { in: ["SYSTEM", user.company_id] },
              },
              select: {
                parentId: true,
                name: true,
                id: true,
                attributes: {
                  select: {
                    label: true,
                    key: true,
                    type: true,
                    isRequired: true,
                  },
                },
              },
            });

            return [
              ...(await recurseUp(result.parentId)),
              ...result.attributes.map((attr) => ({
                ...attr,
                entityTypeId: result.id,
                entityTypeName: result.name,
              })),
            ];
          };

          return await recurseUp(entityTypeId);
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
