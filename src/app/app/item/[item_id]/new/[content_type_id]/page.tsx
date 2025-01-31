import { NewEntityForm } from "@/ui/NewEntityForm";

export default async function Page(props: {
  params: Promise<{ item_id: string; content_type_id: string }>;
}) {
  const { item_id, content_type_id } = await props.params;
  return (
    <NewEntityForm content_type_id={content_type_id} parent_id={item_id} />
  );
}
