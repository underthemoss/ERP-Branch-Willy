import { z } from "zod";
import qs, { ParsedQs } from "qs";
import { ContentTypeDataModel } from "@/types/generated/content-types";

import { ProjectionType, QueryOptions, RootFilterQuery } from "mongoose";

type FilterParam = RootFilterQuery<ContentTypeDataModel>;
type ProjectionParam = ProjectionType<ContentTypeDataModel>;
type OptionsParam = QueryOptions<ContentTypeDataModel>;
const ensureArray = (
  val: string | ParsedQs | (string | ParsedQs)[] | undefined
) => {
  return typeof val === "string" ? [val] : val;
};

export type UniversalQuery = {
  filter: FilterParam;
  include: ProjectionParam;
  options?: OptionsParam;
  components?: {
    map?: boolean;
    list?: boolean;
    kanban?: boolean;
  };
};

export const parseUrl = (url: string) => {
  const rawQuery = qs.parse(url) as unknown as UniversalQuery;
  const query: UniversalQuery = {
    ...rawQuery,
    include: Object.fromEntries(
      Object.entries(rawQuery.include).map(([k, v]) => [k, Number(v)])
    ),
    options: {
      ...rawQuery.options,
      sort: Object.fromEntries(
        Object.entries(rawQuery.options?.sort || {}).map(([k, v]) => [
          k,
          Number(v),
        ])
      ),
    },
    components: {
      ...Object.fromEntries(
        Object.entries(rawQuery.components || {}).map(([k, v]: any) => [
          k,
          v === "true",
        ])
      ),
    },
  };
  return query;
};

export const stringifySearchParams = (
  params: Record<string, string | string[]>
) =>
  Object.entries(params)
    .reduce((acc, [key, value]) => {
      if (typeof value === "string") {
        return [...acc, `${key}=${value}`];
      }
      return [...acc, ...value.map((v) => `${key}=${v}`)];
    }, [] as string[])
    .join("&");

export const encodeUniversalQuery = (query: UniversalQuery) => {
  return qs.stringify(query);
};
