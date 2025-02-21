/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { Entity } from "../../../../../prisma/generated/mongo";
import { SystemEntityTypes } from "@/lib/SystemTypes";
import { revalidatePath } from "next/cache";
import { GlobalColumnIds } from "@/config/ColumnConfig";
import {
  ContentTypeData,
  GlobalContentTypeId,
} from "@/config/ContentTypesConfig";
import { createSystemContentTypeInstance } from "@/services/ContentService";

export type Query = {
  // parent_id?: string;
  // cursor?: string;
  take: number;
  skip: number;
  sort_by: string;
  filters?: { [key: string]: string | number };
  sort_order: "asc" | "desc";
};

export const getColumns = async () => {
  const { user } = await getUser();
  const allColumns = await prisma.column.findMany({
    where: {
      tenant_id: { in: ["SYSTEM", user.company_id] },
    },
    orderBy: {
      order_priority: "desc",
    },
  });
  return allColumns;
};

export const getRows = async (query: Query, column_ids: string[]) => {
  const { user } = await getUser();

  const matchQuery = {
    // parent_id: query.parent_id,
    tenant_id: user.company_id,
    hidden: false,
    ...(query.filters || {}),
  };

  const sort = query.sort_by
    ? {
        sort: {
          [`data.${query.sort_by}`]: query.sort_order === "desc" ? -1 : 1,
        },
        collation: { locale: "en", strength: 2 }, // Case-insensitive collation
      }
    : undefined;

  // using raw to allow arbitrary sort orders
  const rows = (await prisma.entity.findRaw({
    filter: matchQuery,
    options: {
      skip: query.skip,
      limit: query.take,
      projection: {
        _id: 1,
        type_id: 1,
        data: 1,
      },
      ...sort,
    },
  })) as unknown as Entity[];

  return rows.map((row) => {
    return {
      id: (row as unknown as { _id: string })._id,
      type_id: row.type_id,
      values: column_ids.map(
        (id) =>
          ((row.data as Record<string, string>)[id] as
            | string
            | undefined
            | null) || null
      ),
    };
  });
};

export const getItemChildCount = async (query: Query) => {
  const { user } = await getUser();
  const result = await prisma.$runCommandRaw({
    count: "Entity",
    query: {
      tenant_id: user.company_id,
      // parent_id: query.parent_id,
      hidden: false,
      ...query.filters,
    },
  });

  const count = result.n; // The count result
  return Number(count);
};

export const getContentTypeIdsInUse = async (query: Query) => {
  const content_ids = (await prisma.entity.aggregateRaw({
    pipeline: [
      { $match: { ...query.filters } },
      { $group: { _id: "$type_id", count: { $sum: 1 } } },
      { $project: { type_id: "$_id", count: 1, _id: 0 } },
    ],
  })) as unknown as { type_id: string; count: number }[];
  return content_ids;
};

// export const getRows = async () => {
//   return [];
// };

export const getItemWithChildColumns = async (query: Query) => {
  const { user } = await getUser();

  const [item] = await Promise.all([
    // getVisibleColumns(query.parent_id),
    prisma.entity.findFirstOrThrow({
      where: {
        tenant_id: { in: [user.company_id, "SYSTEM"] },
        // id: query.parent_id,
        OR: [{ hidden: false }, { hidden: { isSet: false } }],
      },
      select: {
        data: true,
        type_id: true,
        column_config: true,
        parent: true,
      },
    }),
  ]);

  return {
    // id: query.parent_id,
    count: await getItemChildCount(query),
    all_columns: await getColumns(),
    name: (item.data as any).name,
    data: item.data,
    parent: item.parent,
    // columns: visibleColumns,
    type_id: item.type_id,
    column_config: item.column_config,
  };
};

///////// mutations

export const updateCell = async (
  item_id: string,
  column_key: string,
  value: string | null | undefined
) => {
  const { user } = await getUser();
  const { data } = await prisma.entity.findFirstOrThrow({
    where: { id: item_id, tenant_id: user.company_id },
    select: {
      data: true,
    },
  });

  await prisma.entity.update({
    where: { id: item_id },
    data: {
      data: {
        ...(data as any),
        [column_key]: value,
        updated_by: user.user_id,
        updated_at: new Date(),
      },
    },
  });
  // revalidatePath("/");
};

export const addRow = async (item_id: string) => {
  const { user } = await getUser();
  await prisma.entity.create({
    data: {
      tenant_id: user.company_id,
      parent_id: item_id,
      type_id: "system_item" satisfies SystemEntityTypes,
      data: {
        updated_by: user.user_id,
        updated_at: new Date(),
        created_by: user.user_id,
        created_at: new Date(),
      },
    },
  });
  revalidatePath("/");
};

export const addRecord = async (parentId: string) => {
  await createSystemContentTypeInstance({
    contentTypeId: "record",
    attributes: {
      name: "",
    },
    parentId: parentId,
  });
  revalidatePath("/");
};

export const updateColumnOrder = async (
  itemId: string,
  columnIds: string[]
) => {
  console.time("moveHeader");

  const { user } = await getUser();
  const { column_config } = await prisma.entity.findFirstOrThrow({
    where: { tenant_id: user.company_id, id: itemId },
  });

  const newOrder = columnIds.map(
    (id) => column_config.find((c) => c.key === id)!
  );
  await prisma.entity.update({
    where: { tenant_id: user.company_id, id: itemId },
    data: {
      column_config: newOrder,
    },
  });

  console.timeEnd("moveHeader");
};

export const updateColumnWidths = async (itemId: string, widths: number[]) => {
  const { user } = await getUser();
  const { column_config } = await prisma.entity.findFirstOrThrow({
    where: { tenant_id: user.company_id, id: itemId },
  });

  const newOrder = column_config.map((c, i) => ({ ...c, width: widths[i] }));
  await prisma.entity.update({
    where: { tenant_id: user.company_id, id: itemId },
    data: {
      column_config: newOrder,
    },
  });
};

export const deleteItem = async (item_id: string): Promise<void> => {
  const { user } = await getUser();

  await prisma.entity.delete({
    where: { id: item_id, tenant_id: user.company_id },
  });

  revalidatePath("/");
};

export const getTreeNode = async (item_id: string | null) => {
  const { user } = await getUser();
  return await prisma.entity.findMany({
    where: {
      tenant_id: user.company_id,
      ...(item_id ? { parent_id: item_id } : { parent_id: { isSet: false } }),
    },
    take: 50,
  });
};
