"use server";

import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const getEntityCardData = async (item_id: string) => {
  const { user } = await getUser();
  const item = await prisma.entity.findFirstOrThrow({
    where: { id: item_id, tenant_id: user.company_id },
    include: {
      parent: true,
    },
  });
  return item;
};
