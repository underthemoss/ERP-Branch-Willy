/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { Entity } from "../../../../../prisma/generated/mongo";
import { SystemEntityTypes } from "@/lib/SystemTypes";
import { revalidatePath } from "next/cache";

export type Query = {
  parent_id: string;
  // cursor?: string;
  take: number;
  skip: number;
  sort_by: string;
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
    parent_id: query.parent_id,
    tenant_id: user.company_id,
    hidden: false,
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
  return await prisma.entity.count({
    where: {
      tenant_id: user.company_id,
      parent_id: query.parent_id,
      OR: [{ hidden: false }, { hidden: { isSet: false } }],
    },
  });
};

export const getVisibleColumns = async (item_id: string) => {
  const { user } = await getUser();
  const visibleColumns = await prisma.entity.findMany({
    where: {
      tenant_id: user.company_id,
      parent_id: item_id,
      type_id: { in: ["system_parent_column" as SystemEntityTypes] },
    },
    select: {
      data: true,
      id: true,
    },
    orderBy: {
      sort_order: "asc",
    },
  });
  const columnTypes = await prisma.column.findMany({
    where: {
      id: { in: visibleColumns.map(({ data }) => (data as any).column_id) },
      tenant_id: { in: ["SYSTEM", user.company_id] },
    },
  });
  return visibleColumns.map((ext) => {
    const data = ext.data as {
      column_id: string;
      name: string;
      column_width: number;
    };
    return {
      id: ext.id,
      column_id: data.column_id,
      name: data.name,
      column_width: data.column_width || 120,
      column_type: columnTypes.find((c) => c.id === data.column_id),
    };
  });
};

export const getItemWithChildColumns = async (query: Query) => {
  const { user } = await getUser();

  const [visibleColumns, parent] = await Promise.all([
    getVisibleColumns(query.parent_id),
    prisma.entity.findFirstOrThrow({
      where: {
        tenant_id: user.company_id,
        id: query.parent_id,
        OR: [{ hidden: false }, { hidden: { isSet: false } }],
      },
      select: {
        data: true,
        type_id: true,
      },
    }),
  ]);

  return {
    id: query.parent_id,
    count: await getItemChildCount(query),
    all_columns: await getColumns(),
    name: (parent.data as any).name,
    columns: visibleColumns,
    type_id: parent.type_id,
  };
};

///////// mutations

export const updateCell = async (
  item_id: string,
  columnId: string,
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
        [columnId]: value,
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

export const updateColumnOrder = async (columnIds: string[]) => {
  console.time("moveHeader");

  const { user } = await getUser();

  await prisma.$runCommandRaw({
    update: "Entity",
    updates: columnIds.map((id, i) => {
      return {
        q: { _id: id },
        u: { $set: { sort_order: i } },
      };
    }),
  });

  console.timeEnd("moveHeader");
};

export const updateColumnWidths = async (
  columns: { id: string; width: number }[]
) => {
  const { user } = await getUser();
  console.time("changeColumnWidth");
  await prisma.$runCommandRaw({
    update: "Entity",
    updates: columns.map(({ id, width }) => {
      return {
        q: { _id: id },
        u: { $set: { "data.column_width": width } },
      };
    }),
  });
  console.timeEnd("changeColumnWidth");
  // revalidatePath("/");
};

export const updateToggleSelectedColumns = async (
  item_id: string,
  column_id: string
) => {
  const { user } = await getUser();
  const columns = await getVisibleColumns(item_id);
  const exists = columns.filter((c) => c.column_id === column_id);
  if (exists.length > 0) {
    await prisma.entity.deleteMany({
      where: { id: { in: exists.map((c) => c.id) } },
    });
  } else {
    await prisma.entity.create({
      data: {
        data: {
          column_id,
        },
        hidden: true,
        tenant_id: user.company_id,
        parent_id: item_id,
        type_id: "system_parent_column" satisfies SystemEntityTypes,
      },
    });
  }

  revalidatePath("/");
};

export const deleteItem = async (item_id: string): Promise<void> => {
  const { user } = await getUser();

  await prisma.entity.delete({
    where: { id: item_id, tenant_id: user.company_id },
  });

  revalidatePath("/");
};
