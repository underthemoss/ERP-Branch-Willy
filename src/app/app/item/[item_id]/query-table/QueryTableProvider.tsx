"use client";
import { createContext, useContext } from "react";
import { getRows, Query } from "../actions";

import _ from "lodash";
import { ContentTypeConfigField } from "../../../../../../prisma/generated/mongo";
import { denormaliseConfig } from "@/lib/content-types/ContentTypesConfigParser";
import { QueryTableData } from "./QueryTable.actions";

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

  data: QueryTableData;
}> = ({ children, data }) => {
  return (
    <QueryTableProviderContext.Provider value={data}>
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
