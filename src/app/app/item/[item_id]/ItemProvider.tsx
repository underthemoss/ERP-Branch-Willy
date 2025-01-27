"use client";
import { createContext, useContext, useState } from "react";
import { getColumns, getItem, getChildren, getVisibleColumns } from "./actions";
import _ from "lodash";

type ItemType = Awaited<ReturnType<typeof getItem>>;
type Columns = Awaited<ReturnType<typeof getColumns>>;
type VisibleColumns = Awaited<ReturnType<typeof getVisibleColumns>>;
type LoadedChildren = (
  | Awaited<ReturnType<typeof getChildren>>[number]
  | null
)[];
const ItemProviderContext = createContext<{
  item: ItemType;
  columns: Columns;
  totalChildren: number;
  visibleColumns: VisibleColumns;
  resolveChildren: (props: {
    item_id: string;
    skip?: number;
    take?: number;
    order_by: string;
  }) => Promise<void> | undefined;
  children: LoadedChildren;
}>({
  item: null as unknown as ItemType, // this is never really null
  columns: null as unknown as Columns,
  totalChildren: 0,
  resolveChildren: async () => {},
  children: [],
  visibleColumns: [],
});

export const ItemProvider: React.FC<{
  children: React.ReactNode;
  totalChildren: number;
  item: ItemType;
  columns: Columns;
  initialChildren: LoadedChildren;
  visibleColumns: VisibleColumns;
}> = ({
  children,
  item,
  columns,
  totalChildren,
  initialChildren,
  visibleColumns,
}) => {
  const updateArray = <T,>(
    original: T[],
    replacements: T[],
    start: number
  ): T[] => [
    ...original.slice(0, start),
    ...replacements,
    ...original.slice(start + replacements.length),
  ];
  const [loadedChildren, setLoadedChildren] = useState<LoadedChildren>(
    updateArray(
      Array.from({ length: totalChildren }).fill(null) as null[],
      initialChildren,
      0
    )
  );

  return (
    <ItemProviderContext.Provider
      value={{
        item,
        columns,
        totalChildren,
        visibleColumns,
        resolveChildren: async (props) => {
          setLoadedChildren((loadedChildren) =>
            updateArray(
              loadedChildren,
              Array.from({ length: props.take || 0 }).map(() => {
                return {
                  column_config: [],
                  data: {},
                  id: "",
                  parent_id: "",
                  tenant_id: "",
                  type_id: "",
                  hidden: false,
                  sort_order: 0,
                };
              }),
              props.skip || 0
            )
          );
          const items = await getChildren(props);

          setLoadedChildren((loadedChildren) =>
            updateArray(loadedChildren, items, props.skip || 0)
          );
        },
        children: loadedChildren,
      }}
    >
      {children}
    </ItemProviderContext.Provider>
  );
};

export const useItem = () => {
  const {
    item,
    columns,
    totalChildren,
    children: loadedChildren,
    resolveChildren: getChildren,
    visibleColumns,
  } = useContext(ItemProviderContext);

  // const displayColumns = visibleColumns.map((config) => ({
  //   column: columns.find((col) => col.id === config.column_id)!,
  //   ...config,
  // }));
  return {
    item,
    columns,
    displayColumns: visibleColumns,
    totalChildren,
    resolveChildren: getChildren,
    loadedChildren,
  };
};
