"use server";

import { denormaliseConfig } from "@/lib/content-types/ContentTypesConfigParser";
import { getContentTypeConfig } from "@/services/ContentTypeRepository";
import { prisma } from "@/lib/prisma";
import {
  ContentTypeConfigField,
  Entity,
} from "../../../../../../prisma/generated/mongo";
import _ from "lodash";
import { getUser } from "@/lib/auth";

type KnownFilterOptions = {
  parent_id?: string;
};
export type Query = {
  take: number;
  skip: number;
  sort_by: string;
  filters?: KnownFilterOptions & { [key: string]: string | number };
  sort_order: "asc" | "desc";
};

const getContentTypeIdsInUse = async (query: Query) => {
  const content_ids = (await prisma.entity.aggregateRaw({
    pipeline: [
      { $match: { ...query.filters } },
      { $group: { _id: "$type_id", count: { $sum: 1 } } },
      { $project: { type_id: "$_id", count: 1, _id: 0 } },
    ],
  })) as unknown as { type_id: string; count: number }[];
  return content_ids;
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

export type QueryTableData = Awaited<ReturnType<typeof getQueryTableData>>;

export const getQueryTableData = async (query: Query) => {
  const config = denormaliseConfig(await getContentTypeConfig());

  const contentTypesInUse = await getContentTypeIdsInUse(query);

  const contentTypeIds = contentTypesInUse.map(({ type_id }) => type_id);

  const columns = config
    .filter((ct) => contentTypeIds.includes(ct.id))
    .reduce((acc, cur) => {
      return _.uniqBy([...acc, ...cur.computed.allFields], (attr) => attr.id);
    }, [] as ContentTypeConfigField[]);

  const rows = await getRows(
    query,
    columns.map((c) => c.id)
  );

  return {
    contentTypes: config,
    columns,
    rows,
    query,
  };
};
