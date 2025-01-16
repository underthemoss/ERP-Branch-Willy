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
              id: string;
              name: string;
              type: EntityAttributeValueType;
              entityTypeId: string;
              entityTypeName: string;
              tenantId: string;
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
                    name: true,
                    id: true,
                    type: true,
                    tenantId: true,
                    isRequired: true,
                  },
                  where: {
                    tenantId: {
                      in: ["SYSTEM", user.company_id],
                    },
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
        async getChildEntityTypes<T>(this: T, entityTypeId: string) {
          const { user } = await useAuth();
          await prisma.entityType.findMany({
            where: {
              tenantId: { in: ["SYSTEM", user.company_id] },
              parentId: entityTypeId,
            },
            select: {
              id: true,
              name: true,
            },
          });
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
