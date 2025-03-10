import { NextLink } from "@/ui/NextLink";
import HomeIcon from "@mui/icons-material/Home";
import { Box, Breadcrumbs, IconButton, Link } from "@mui/joy";
import { getUser } from "@/lib/auth";
import NewButton from "../../NewButton";
import { ContentTypeComponent } from "@/ui/Icons";
import { Entity, findEntities } from "@/db/mongoose";

const traverseUp = async (
  tenantId: string,
  id: string | null
): Promise<
  { id: string; name: string; typeId: string; icon: string; color: string }[]
> => {
  if (!id || id === "null") return [];
  const {
    results: [entity],
  } = await findEntities({
    filter: {
      id: id,
    },
    include: {
      _id: 1,
      type: 1,
      data: 1,
    },
  });

  if (!entity) return [];

  return [
    ...(await traverseUp(tenantId, entity.parent_id || null)),
    {
      name: entity.title,
      id: entity.id,
      typeId: entity.type,
      icon: "FolderOpen",
      color: "gray",
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
