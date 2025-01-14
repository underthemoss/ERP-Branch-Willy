import { prisma } from "@/lib/prisma";

export default async function Page(props: {
  params: Promise<{ item_id: string }>;
}) {
  const { item_id } = await props.params;
  const { name } = await prisma.entity.findFirstOrThrow({
    where: {
      id: item_id,
    },
  });
  return <div>here: {name}</div>;
}
