import { getItemWithChildColumns, getRows, Query } from "./actions";
import { ItemProvider } from "./ItemProvider";
import { ItemTable } from "./table/ItemTable";
export default async function Page(props: {
  params: Promise<{ item_id: string }>;
  searchParams: Promise<{ sort_by: string; sort_order: string }>;
}) {
  const { item_id } = await props.params;
  const { sort_by, sort_order } = await props.searchParams;

  const query: Query = {
    parent_id: item_id,
    skip: 0,
    take: 60,
    sort_by: sort_by || "created_at",
    sort_order: sort_order === "desc" ? "desc" : "asc",
  };
  const result = await getItemWithChildColumns(query);
  const rows = await getRows(
    query,
    result.columns.map(({ column_id }) => column_id)
  );

  return (
    <ItemProvider key={Date.now()} query={query} item={{ ...result, rows }}>
      <ItemTable />
    </ItemProvider>
  );
}
