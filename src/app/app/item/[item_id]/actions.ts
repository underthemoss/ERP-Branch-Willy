"use server";

import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import _ from "lodash";
import { ColumnType, Entity } from "../../../../../prisma/generated/mongo";
import { SystemEntityTypes } from "@/lib/SystemTypes";
import { revalidatePath } from "next/cache";

export type Query = {
  parent_id: string;
  cursor?: string;
  take: number;
  skip: number;
  order_by: string;
};

export const getColumns = async () => {
  const { user } = await getAuthUser();
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

export const getRowsOld = async (query: Query, column_ids: string[]) => {
  const { user } = await getAuthUser();
  // prefer cursor based if available, this is much more performant
  const pagination = query.cursor
    ? { cursor: { id: query.cursor }, skip: 1 }
    : { skip: query.skip };

  const rows = await prisma.entity.findMany({
    where: {
      parent_id: query.parent_id,
      tenant_id: user.company_id,
      OR: [{ hidden: false }, { hidden: { isSet: false } }],
    },
    ...pagination,
    take: query.take,
    select: { id: true, type_id: true, data: true },
  });

  return rows.map((row) => {
    return {
      id: row.id,
      type_id: row.type_id,
      values: column_ids.map((id) => (row.data as any)[id] as string),
    };
  });
};

export const getRows = async (query: Query, column_ids: string[]) => {
  const { user } = await getAuthUser();

  // Prepare the pagination logic for raw query
  const pagination = query.cursor
    ? {
        _id: { $gt: query.cursor },
      }
    : {};

  const matchQuery = {
    parent_id: query.parent_id,
    tenant_id: user.company_id,
    $or: [{ hidden: false }, { hidden: { $exists: false } }],
    // ...pagination,
  };

  // using raw to allow arbitrary sort orders
  const rows = (await prisma.entity.findRaw({
    filter: matchQuery,
    options: {
      skip: query.cursor ? 1 : query.skip,
      limit: query.take,
      projection: {
        _id: 1,
        type_id: 1,
        data: 1,
      },
    },
  })) as unknown as Entity[];

  return rows.map((row) => {
    return {
      id: (row as any)._id,
      type_id: row.type_id,
      values: column_ids.map((id) => ((row.data as any)[id] as string) || ""),
    };
  });
};

export const getItemChildCount = async (query: Query) => {
  const { user } = await getAuthUser();
  return await prisma.entity.count({
    where: {
      tenant_id: user.company_id,
      parent_id: query.parent_id,
      OR: [{ hidden: false }, { hidden: { isSet: false } }],
    },
  });
};
export const getItemWithChildColumns = async (query: Query) => {
  const { user } = await getAuthUser();

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

/////////

export const getItem = async (item_id: string) => {
  const { user } = await getAuthUser();
  return await prisma.entity.findFirstOrThrow({
    where: { tenant_id: user.company_id, id: item_id },
  });
};

export const getTotalChildren = async (item_id: string) => {
  const { user } = await getAuthUser();
  return await prisma.entity.count({
    where: {
      tenant_id: user.company_id,
      parent_id: item_id,
      OR: [{ hidden: { isSet: false } }, { hidden: false }],
    },
  });
};

export const getChildren = async ({
  item_id,
  take = 20,
  skip = 0,
  order_by = "equipment_category",
}: {
  item_id: string;
  skip?: number;
  take?: number;
  order_by: string;
}) => {
  const { user } = await getAuthUser();

  const result = (await prisma.entity.findRaw({
    filter: {
      tenant_id: { $eq: user.company_id },
      parent_id: { $eq: item_id },
      $or: [{ hidden: { $eq: false } }, { hidden: { $exists: false } }],
    },
    options: {
      sort: { [`data.${order_by}`]: 1, _id: 1 },
      limit: take,
      skip: skip,
    },
  })) as unknown as (Entity & { _id: string })[];

  return result.map(
    ({ _id, ...rest }) =>
      ({
        ...rest,
        id: _id,
      } as Entity)
  );
};

export const updateCell = async (
  item_id: string,
  columnId: string,
  value: string
) => {
  const { user } = await getAuthUser();
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
  revalidatePath("/");
};

export const addRow = async (item_id: string) => {
  const { user } = await getAuthUser();
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

export const moveHeader = async (
  item_id: string,
  draggedIndex: number,
  targetIndex: number
) => {
  console.time("moveHeader");

  const { user } = await getAuthUser();
  const { parent_id } = await prisma.entity.findFirstOrThrow({
    where: { tenant_id: user.company_id, id: item_id },
    select: {
      parent_id: true,
    },
  });
  const items = await getVisibleColumns(parent_id!);

  const draggedColumn = items[draggedIndex];
  const columnsWithoutDragged = items.filter((i) => i !== draggedColumn);
  const columnUpdates = [
    ...columnsWithoutDragged.slice(0, targetIndex),
    draggedColumn,
    ...columnsWithoutDragged.slice(targetIndex),
  ].map((c, i) => ({
    q: { _id: c.id },
    u: { $set: { sort_order: i } },
  }));

  await prisma.$runCommandRaw({
    update: "Entity",
    updates: columnUpdates,
  });

  console.timeEnd("moveHeader");
  revalidatePath("/");
};

export const changeColumnWidth = async (
  objectId: string,

  width: number
) => {
  const { user } = await getAuthUser();
  console.time("changeColumnWidth");
  await prisma.entity.findFirstOrThrow({
    where: { id: objectId, tenant_id: user.company_id },
  });

  await prisma.$runCommandRaw({
    update: "Entity",
    updates: [
      {
        q: { _id: objectId },
        u: { $set: { "data.column_width": width } },
      },
    ],
  });
  console.timeEnd("changeColumnWidth");
  revalidatePath("/");
};

export const toggleSelectedColumns = async (
  item_id: string,
  column_id: string
) => {
  const { user } = await getAuthUser();
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
  const { user } = await getAuthUser();

  await prisma.entity.delete({
    where: { id: item_id, tenant_id: user.company_id },
  });

  revalidatePath("/");
};

export const getVisibleColumns = async (item_id: string) => {
  const { user } = await getAuthUser();
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
      column_width: data.column_width,
      column_type: columnTypes.find((c) => c.id === data.column_id),
    };
  });
};
