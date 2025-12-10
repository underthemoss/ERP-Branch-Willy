import { redirect } from "next/navigation";

export default function PriceBooksRedirect({ params }: { params: { workspace_id: string } }) {
  redirect(`/app/${params.workspace_id}/prices`);
}
