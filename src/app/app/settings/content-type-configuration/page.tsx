import { ContentTypeTable } from "./ContentTypeTable";

export default async function Page(props: {
  params: Promise<{ item_id: string }>;
}) {
  return <ContentTypeTable />;
}
