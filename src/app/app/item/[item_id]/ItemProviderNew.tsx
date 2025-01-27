"use client";
import { createContext, useContext, useState } from "react";
import { getItemWithChildColumns, getRows } from "./actions";
import _ from "lodash";

type Item = Awaited<ReturnType<typeof getItemWithChildColumns>>;
type Rows = Awaited<ReturnType<typeof getRows>>;
type DeferredRows = (Rows[number] | null)[];

const ItemProviderContext = createContext<{
  item: Item;
  loadMore: (query: { skip: number; take: number }) => Promise<void>;
  rows: DeferredRows;
}>({
  item: null as unknown as Item,
  rows: [],
  loadMore: async () => {},
});

export const ItemProviderNew: React.FC<{
  children: React.ReactNode;
  item: Item;
  rows: Rows;
}> = ({ children, item, rows }) => {
  const [rowsState, setRowsState] = useState<DeferredRows>([
    ...rows,
    ...Array.from({ length: item.count - rows.length }).map((_) => null),
  ]);

  return (
    <ItemProviderContext.Provider
      value={{
        item: { ...item },
        loadMore: async ({ skip, take }) => {
          const moreRows = await getRows(
            { parent_id: item.id, skip, take, order_by: "name" },
            item.columns.map(({ column_id }) => column_id)
          );
          setRowsState(
            rowsState.map((r, i) => {
              if (i >= skip && i < skip + take) {
                return moreRows[i - skip];
              }
              return r;
            })
          );
        },
        rows: rowsState,
      }}
    >
      {children}
    </ItemProviderContext.Provider>
  );
};

export const useItemNew = () => {
  const { item, loadMore, rows } = useContext(ItemProviderContext);

  return {
    item,
    loadMore,
    rows,
  };
};
