import { NextLink } from "@/ui/NextLink";
import { prisma } from "@/lib/prisma";
import HomeIcon from "@mui/icons-material/Home";
import { Box, Breadcrumbs, IconButton, Link } from "@mui/joy";
import { useAuth } from "@/lib/auth";
import NewButton from "../../NewButton";
import { JsonObject } from "@prisma/client/runtime/library";
import { EntityIcon } from "@/ui/EntityTypeIcons";

async function humanizeSlug(slug: string) {
  const entityType = await prisma.entityType.findFirst({ where: { id: slug } });
  return (
    entityType?.name ||
    slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

const traverseUp = async (
  tenantId: string,
  id: string | null
): Promise<{ id: string; name: string; typeId: string }[]> => {
  if (!id || id === "null") return [];

  const entity = await prisma.entity.findFirstOrThrow({
    where: { id, tenantId },
    select: { attributes: true, parentId: true, id: true, entityTypeId: true },
  });

  return [
    ...(await traverseUp(tenantId, entity.parentId)),
    {
      name: (entity.attributes as JsonObject).item_title as string, //todo: item_title is not great here
      id: entity.id,
      typeId: entity.entityTypeId,
    },
  ];
};

export default async function HeaderBreadcrumbs(props: {
  params: Promise<{ catchAll: string[] }>;
}) {
  const { user } = await useAuth();
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
              <EntityIcon entityId={s.id} />
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
