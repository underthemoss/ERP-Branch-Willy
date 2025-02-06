import { useEffect } from "react";
import { getItemWithChildColumns, getRows, Query } from "../actions";
import { ItemProvider } from "../ItemProvider";
import { ItemTable } from "./ItemTable";

export const TableContainer: React.FC<{
  query: Query;
}> = ({ query }) => {
  //   useEffect(() => {
  //     (async () => {
  //       //   const query: Query = {
  //       //     parent_id: item_id,
  //       //     skip: 0,
  //       //     take: 60,
  //       //     sort_by: sort_by || "created_at",
  //       //     sort_order: sort_order === "desc" ? "desc" : "asc",
  //       //   };
  //       const result = await getItemWithChildColumns(query);
  //       const rows = await getRows(
  //         query,
  //         result.column_config.map(({ key }) => key)
  //       );
  //     })();
  //   }, [query]);

  //   return (
  //     <ItemProvider key={Date.now()} query={query}>
  //       <ItemTable />
  //     </ItemProvider>
  //   );

  return null;
};
