import { Query } from "./actions";
import { QueryTable } from "./table/QueryTable";
export default async function Page(props: {
  params: Promise<{ item_id: string }>;
  searchParams: Promise<{ sort_by: string; sort_order: string }>;
}) {
  const { item_id } = await props.params;
  const { sort_by, sort_order } = await props.searchParams;

  const query: Query = {
    skip: 0,
    take: 60,
    sort_by: sort_by || "created_at",
    sort_order: sort_order === "desc" ? "desc" : "asc",
    filters: {
      parent_id: item_id,
    },
  };

  return <QueryTable query={query} />;
}
