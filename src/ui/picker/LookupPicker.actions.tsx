"use server";

import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const searchItems = async (parentId: string, term: string) => {
  const { user } = await getUser();
  const { column_config } = await prisma.entity.findFirstOrThrow({
    where: { id: parentId },
    select: {
      column_config: true,
    },
  });

  const searchFilters = column_config.map((c) => ({
    ["data." + c.key]: {
      $regex: term,
      $options: "i",
    },
  }));

  console.log(searchFilters);

  const items = await prisma.entity.findRaw({
    filter: {
      parent_id: parentId,
      tenant_id: user.company_id,
      hidden: false,
      // Adjust "someKey" to the property in your JSON object you wish to search.
      $or: searchFilters,
    },
    options: {
      limit: 100,
      projection: {
        _id: 1,
      },
    },
  });

  // Map over the results converting the MongoDB ObjectId to a string.
  return (items as unknown as { _id: string }[]).map((item) =>
    item._id.toString()
  );

  return [];
};

export const bulkLoadItems = async (itemIds: string[]) => {
  const { user } = await getUser();
  const items = await prisma.entity.findMany({
    where: {
      tenant_id: user.company_id,
      id: { in: itemIds },
    },
    include: {
      parent: {
        select: {
          column_config: true,
        },
      },
    },
  });
  return itemIds.map((id) => items.find((i) => i.id === id));
};
