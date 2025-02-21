"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { getContentTypeIdsInUse, getRows, Query } from "../actions";
import { getContentTypes } from "@/services/ContentTypeRepository";
import _ from "lodash";
import { ContentTypeAttribute } from "../../../../../../prisma/generated/mongo";

type ContentTypes = Awaited<ReturnType<typeof getContentTypes>>;
type Row = Awaited<ReturnType<typeof getRows>>[number];

const QueryTableProviderContext = createContext<{
  contentTypes: ContentTypes;
  query: Query;
  columns: ContentTypeAttribute[];
  rows: Row[];
}>({
  query: null as unknown as Query,
  contentTypes: [] as ContentTypes,
  columns: [] as ContentTypeAttribute[],
  rows: [] as Row[],
});

export const QueryTableProvider: React.FC<{
  children: React.ReactNode;
  query: Query;
}> = ({ children, query }) => {
  // const [item, setItem] = useState<ParentItem>();
  const [contentTypes, setContentTypes] = useState<ContentTypes>([]);
  const [columns, setColumns] = useState<ContentTypeAttribute[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    (async () => {
      const [contentTypes, contentTypesInUse] = await Promise.all([
        getContentTypes(),
        getContentTypeIdsInUse(query),
      ]);

      const contentTypeIds = contentTypesInUse.map(({ type_id }) => type_id);

      const columns = contentTypes
        .filter((ct) => contentTypeIds.includes(ct.id))
        .reduce((acc, cur) => {
          return _.uniqBy([...acc, ...cur.allAttributes], (attr) => attr.key);
        }, [] as ContentTypeAttribute[]);

      const rows = await getRows(
        query,
        columns.map((c) => c.key)
      );

      setColumns(columns);
      setContentTypes(contentTypes);
      setRows(rows);
    })();
  }, []);

  return (
    <QueryTableProviderContext.Provider
      value={{ query, contentTypes, columns, rows }}
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
