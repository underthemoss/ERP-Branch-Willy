import { NextLink } from "@/ui/NextLink";
import { prisma } from "@/lib/prisma";
import HomeIcon from "@mui/icons-material/Home";
import { Box, Breadcrumbs, IconButton, Link } from "@mui/joy";
import NewButton from "../NewButton";

async function humanizeSlug(slug: string) {
  const entityType = await prisma.entityType.findFirst({ where: { id: slug } });
  return (
    entityType?.name ||
    slug
      .split("-") // Split the slug by hyphens
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
      .join(" ")
  ); // Join the words with spaces
}

export default async function HeaderBreadcrumbs(props: {
  params: Promise<{ catchAll: string[] }>;
}) {
  const segments = (await props.params).catchAll?.splice(1) || [];

  return (
    <Box display="flex">
      <Breadcrumbs separator="›" aria-label="breadcrumbs">
        <NextLink href="/app">
          <IconButton size="sm" color="neutral">
            <HomeIcon></HomeIcon>
          </IconButton>
        </NextLink>
        {segments.length === 0 && <NextLink href="/app">Workspaces</NextLink>}
        {segments.map((s, i, all) => (
          <NextLink href={`/app/${all.slice(0, i + 1).join("/")}`} key={s}>
            {humanizeSlug(s)}
          </NextLink>
        ))}
      </Breadcrumbs>
      <Box flex={1}></Box>
      <Box p={1}>
        <NewButton itemId="" />
      </Box>
    </Box>
  );
}
