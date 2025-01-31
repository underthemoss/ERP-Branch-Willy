import { NextLink } from "@/ui/NextLink";
import { prisma } from "@/lib/prisma";
import HomeIcon from "@mui/icons-material/Home";
import { Breadcrumbs, IconButton, Link } from "@mui/joy";

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
  const segments = (await props.params).catchAll?.splice(1);

  return (
    <>
      <Breadcrumbs separator="›" aria-label="breadcrumbs">
        <NextLink href="/app">
          <IconButton size="sm" color="neutral">
            <HomeIcon></HomeIcon>
          </IconButton>
        </NextLink>
        {segments.map((s, i, all) => (
          <NextLink href={`/app/${all.slice(0, i + 1).join("/")}`} key={s}>
            {humanizeSlug(s)}
          </NextLink>
        ))}
      </Breadcrumbs>
    </>
  );
}
