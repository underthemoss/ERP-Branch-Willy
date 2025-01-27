import { prisma } from "@/lib/prisma";
import {
  getChildren,
  getColumns,
  getItem,
  getItemWithChildColumns,
  getRows,
  getTotalChildren,
  getVisibleColumns,
  Query,
} from "./actions";

// import { ItemProvider } from "./ItemProvider";
// import { ItemTable } from "./table/ItemTable";
import { getAuthUser } from "@/lib/auth";
import { ItemProviderNew } from "./ItemProviderNew";
import { ItemTableNew } from "./table copy/ItemTable";
export default async function Page(props: {
  params: Promise<{ item_id: string }>;
}) {
  const { item_id } = await props.params;

  const { user } = await getAuthUser();

  console.time("getall");
  const query: Query = {
    parent_id: item_id,
    skip: 0,
    take: 30,
    order_by: 'name'
  };
  const result = await getItemWithChildColumns(query);
  const rows = await getRows(
    query,
    result.columns.map(({ column_id }) => column_id)
  );

  console.timeEnd("getall");
  return (
    <ItemProviderNew item={result} rows={rows}>
      <ItemTableNew />
    </ItemProviderNew>
  );
}
