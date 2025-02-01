"use server";

import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const searchItems = async (parentId: string, term: string) => {
  const { user } = await getUser();
  const items = await prisma.entity.findMany({
    take: 100,
    where: {
      parent_id: parentId,
      tenant_id: user.company_id,
      hidden: false,
    },
  });
  return items.map((u) => u.id.toString());
};

export const bulkLoadItems = async (itemIds: string[]) => {
  const { user } = await getUser();
  const items = await prisma.entity.findMany({
    where: {
      tenant_id: user.company_id,
      id: { in: itemIds },
    },
  });
  return itemIds.map((id) => items.find((i) => i.id === id));
};
