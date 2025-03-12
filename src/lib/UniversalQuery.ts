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
  const rawQuery = qs.parse(url, {
    decoder(str, defaultDecoder, charset, type) {
      const result = defaultDecoder(str, defaultDecoder, charset);
      // Only process value types
      if (type === "value" && !isNaN(result as any) && result.trim() !== "") {
        // Convert to number (handles both integers and floats)
        const num = Number(result);
        return isNaN(num) ? result : num;
      }
      return result;
    },
  }) as unknown as UniversalQuery;

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
      skip: Number(rawQuery.options?.skip || 0),
      limit: Number(rawQuery.options?.limit || 0),
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
