import { NextLink } from "@/ui/NextLink";
import { prisma } from "@/lib/prisma";
import HomeIcon from "@mui/icons-material/Home";
import { Box, Breadcrumbs, IconButton, Link } from "@mui/joy";
import { getUser } from "@/lib/auth";
import NewButton from "../../NewButton";
import { JsonObject } from "@prisma/client/runtime/library";
import { EntityTypeIcon } from "@/ui/EntityTypeIcons";
import { EntityTypeIcon as EntityTypeIconEnum } from "../../../../../../prisma/generated/mongo";

const traverseUp = async (
  tenantId: string,
  id: string | null
): Promise<
  { id: string; name: string; typeId: string; icon: EntityTypeIconEnum }[]
> => {
  if (!id || id === "null") return [];

  const entity = await prisma.entity.findFirstOrThrow({
    where: { id, tenant_id: { in: ["SYSTEM", tenantId] } },
    select: {
      data: true,
      parent_id: true,
      id: true,
      type_id: true,
      type: { select: { icon: true } },
    },
  });

  return [
    ...(await traverseUp(tenantId, entity.parent_id)),
    {
      name: (entity.data as JsonObject).name as string, //todo: item_title is not great here
      id: entity.id,
      typeId: entity.type_id,
      icon: entity.type.icon,
    },
  ];
};

export default async function HeaderBreadcrumbs(props: {
  params: Promise<{ catchAll: string[] }>;
}) {
  const { user } = await getUser();
  const itemId = (await props.params).catchAll[2];
  const ancestors = await traverseUp(user.company_id, itemId);

  return (
    <>
      <Box display={"flex"}>
        <Breadcrumbs separator="›" aria-label="breadcrumbs">
          <NextLink href="/app">
            <IconButton size="sm" color="neutral">
              <HomeIcon></HomeIcon>
            </IconButton>
          </NextLink>

          {ancestors.map((s) => (
            <NextLink href={`/app/item/${s.id}`} key={s.id}>
              <EntityTypeIcon entityTypeIcon={s.icon} entityId={s.id} />
              <Box ml={1}>{s.name}</Box>
            </NextLink>
          ))}
        </Breadcrumbs>
        <Box flex={1}></Box>
        <Box p={1}>
          <NewButton itemId={itemId} />
        </Box>
      </Box>
    </>
  );
}
