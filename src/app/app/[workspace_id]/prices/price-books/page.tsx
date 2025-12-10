import { redirect } from "next/navigation";

export default async function PriceBooksRedirect({
  params,
}: {
  params: Promise<{ workspace_id: string }>;
}) {
  const { workspace_id } = await params;
  redirect(`/app/${workspace_id}/prices`);
}
