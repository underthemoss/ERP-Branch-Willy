import { NextLink } from "@/ui/NextLink";
import { prisma } from "@/lib/prisma";
import HomeIcon from "@mui/icons-material/Home";
import { Box, Breadcrumbs, IconButton, Link } from "@mui/joy";
import { getUser } from "@/lib/auth";
import NewButton from "../../NewButton";
import { JsonObject } from "@prisma/client/runtime/library";
import { ContentTypeComponent } from "@/ui/Icons";
import { getContentTypeConfig } from "@/services/ContentTypeRepository";
import { denormaliseConfig } from "@/lib/content-types/ContentTypesConfigParser";

const traverseUp = async (
  tenantId: string,
  id: string | null,
  contentTypes: ReturnType<typeof denormaliseConfig>
): Promise<
  { id: string; name: string; typeId: string; icon: string; color: string }[]
> => {
  if (!id || id === "null") return [];

  const entity = await prisma.entity.findFirstOrThrow({
    where: { id, tenant_id: tenantId },
    select: {
      data: true,
      parent_id: true,
      id: true,
      type_id: true,
      // type: { select: { icon: true, color: true } },
    },
  });
  const type = contentTypes.find((ct) => ct.id === entity.type_id);
  return [
    ...(await traverseUp(tenantId, entity.parent_id, contentTypes)),
    {
      name: Object.values(entity.data as JsonObject)[0] as string,
      id: entity.id,
      typeId: type?.id || "",
      icon: type?.icon || "",
      color: type?.color || "",
    },
  ];
};

export default async function HeaderBreadcrumbs(props: {
  params: Promise<{ catchAll: string[] }>;
}) {
  const { user } = await getUser();
  const itemId = (await props.params).catchAll[2];
  const contentTypes = denormaliseConfig(await getContentTypeConfig());
  const ancestors = await traverseUp(user.company_id, itemId, contentTypes);
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
              <ContentTypeComponent
                color={s.color}
                icon={s.icon}
                label={s.name}
              />
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
