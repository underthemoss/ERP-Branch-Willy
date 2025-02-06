"use client";
import { ActionDispatch, createContext, useContext, useReducer } from "react";
import {
  getItemWithChildColumns,
  getRows,
  Query,
  updateCell,
  updateColumnOrder,
  updateColumnWidths,
} from "./actions";

type Rows = Awaited<ReturnType<typeof getRows>>;
type DeferredRows = (Rows[number] | null | undefined)[];
type ParentItem = Awaited<ReturnType<typeof getItemWithChildColumns>> & {
  rows: DeferredRows;
};
const ItemProviderContext = createContext<{
  item: ParentItem;
  dispatch: ActionDispatch<[action: Events]>;
  query: Query;
}>({
  item: null as unknown as ParentItem,
  dispatch: () => {},
  query: null as unknown as Query,
});

type Events =
  | {
      type: "update_cell_value";
      item_id: string;
      column_index: number;
      value: string | null;
    }
  | {
      type: "hydrate_row";
      row: DeferredRows[number];
      index: number;
    }
  | {
      type: "update_column_widths";
      widths: number[];
    }
  | {
      type: "update_column_order";
      column_ids: string[];
    };

const rowReducer = (
  state: DeferredRows[number],
  action: Events
): DeferredRows[number] => {
  if (!state) return state;
  switch (action.type) {
    case "update_cell_value":
      if (action.item_id !== state.id) return state;
      return {
        ...state,
        values: state.values.map((v, i) =>
          i === action.column_index ? action.value : v
        ),
      };
    default:
      return { ...state };
  }
};

const reducer = (state: ParentItem, action: Events) => {
  switch (action.type) {
    case "update_column_widths":
      return {
        ...state,
        column_config: state.column_config.map((c, i) => ({
          ...c,
          width: action.widths[i],
        })),
      };
    case "hydrate_row":
      return {
        ...state,
        rows: state.rows.map((row, i) =>
          i === action.index ? action.row : row
        ),
      };
    case "update_cell_value":
      return {
        ...state,
        rows: state.rows.map((r) => rowReducer(r, action)),
      };
    case "update_column_order":
      const newOrder = action.column_ids.map(
        (id) => state.column_config.findIndex((c) => c.key === id)!
      );

      return {
        ...state,
        column_config: newOrder.map((o) => state.column_config[o]),
        rows: state.rows.map((r) =>
          r ? { ...r, values: newOrder.map((i) => r.values[i]) } : r
        ),
      };
    default:
      return { ...state };
  }
};

export const ItemProvider: React.FC<{
  children: React.ReactNode;
  item: ParentItem;
  query: Query;
}> = ({ children, item, query }) => {
  // const [isPrending, startTransition] = useTransition();
  const [optimisticcValue, dispatch] = useReducer(reducer, {
    ...item,
    rows: [
      ...item.rows,
      ...Array.from({ length: item.count - item.rows.length }).map(() => null),
    ],
  });

  return (
    <ItemProviderContext.Provider
      value={{
        item: optimisticcValue,
        dispatch,
        query,
      }}
    >
      {children}
    </ItemProviderContext.Provider>
  );
};

export const useItem = () => {
  const { item, dispatch, query } = useContext(ItemProviderContext);
  return {
    item,
    query,
    loadMore: async (props: { skip: number; take: number }) => {
      for (const row in Array.from({ length: props.take })) {
        dispatch({
          type: "hydrate_row",
          row: { id: row, type_id: "", values: [] },
          index: Number(row) + props.skip,
        });
      }
      const moreRows = await getRows(
        {
          parent_id: item.id,
          skip: props.skip,
          take: props.take,
          sort_by: query.sort_by,
          sort_order: query.sort_order,
        },
        item.column_config.map(({ key }) => key)
      );
      for (const row in moreRows) {
        dispatch({
          type: "hydrate_row",
          row: moreRows[row],
          index: Number(row) + props.skip,
        });
      }
    },
    updateRowValue: async (props: {
      column_Key: string;
      item_id: string;
      value: string | null;
    }) => {
      dispatch({
        type: "update_cell_value",
        column_index: item.column_config.findIndex(
          (c) => c.key === props.column_Key
        ),
        item_id: props.item_id,
        value: props.value,
      });
      await updateCell(props.item_id, props.column_Key, props.value);
    },
    updateColumnWidths: async (props: { widths: number[] }) => {
      dispatch({
        type: "update_column_widths",
        widths: props.widths,
      });
      await updateColumnWidths(item.id, props.widths);
    },

    updateColumnOrder: async (props: { columnKeys: string[] }) => {
      dispatch({
        type: "update_column_order",
        column_ids: props.columnKeys,
      });
      await updateColumnOrder(item.id, props.columnKeys);
    },
    moveColumn: async (props: {
      draggedColumnIndex: number;
      destinationIndex: number;
    }) => {
      // dispatch({
      //   type: "update_column_position",
      //   column_index: props.draggedColumnIndex,
      //   new_column_index: props.destinationIndex,
      // });
      // const id = item.columns[props.destinationIndex].id;
      // await updateMoveHeader(
      //   id,
      //   props.draggedColumnIndex,
      //   props.destinationIndex
      // );
    },
  };
};
