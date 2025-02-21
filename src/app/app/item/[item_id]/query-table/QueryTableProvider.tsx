"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { getContentTypeIdsInUse, getRows, Query } from "../actions";

import _ from "lodash";
import {
  ContentTypeAttribute,
  ContentTypeConfigField,
} from "../../../../../../prisma/generated/mongo";
import { useContentTypes } from "@/lib/content-types/useContentTypes";
import { denormaliseConfig } from "@/lib/content-types/ContentTypesConfigParser";

type ContentTypes = ReturnType<typeof denormaliseConfig>;
type Row = Awaited<ReturnType<typeof getRows>>[number];

const QueryTableProviderContext = createContext<{
  contentTypes: ContentTypes;
  query: Query;
  columns: ContentTypeConfigField[];
  rows: Row[];
}>({
  query: null as unknown as Query,
  contentTypes: [] as ContentTypes,
  columns: [] as ContentTypeConfigField[],
  rows: [] as Row[],
});

export const QueryTableProvider: React.FC<{
  children: React.ReactNode;
  query: Query;
}> = ({ children, query }) => {
  // const [item, setItem] = useState<ParentItem>();
  const { config } = useContentTypes();

  const [columns, setColumns] = useState<ContentTypeConfigField[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    (async () => {
      const [contentTypesInUse] = await Promise.all([
        getContentTypeIdsInUse(query),
      ]);

      const contentTypeIds = contentTypesInUse.map(({ type_id }) => type_id);

      const columns = config
        .filter((ct) => contentTypeIds.includes(ct.id))
        .reduce((acc, cur) => {
          return _.uniqBy(
            [...acc, ...cur.computed.allFields],
            (attr) => attr.id
          );
        }, [] as ContentTypeConfigField[]);

      const rows = await getRows(
        query,
        columns.map((c) => c.id)
      );
      setColumns(columns);
      setRows(rows);
    })();
  }, []);

  return (
    <QueryTableProviderContext.Provider
      value={{ query, contentTypes: config, columns, rows }}
    >
      {children}
    </QueryTableProviderContext.Provider>
  );
};

export const useTable = () => {
  const { query, contentTypes, columns, rows } = useContext(
    QueryTableProviderContext
  );

  return {
    query,
    contentTypes,
    columns,
    rows,
  };
};
