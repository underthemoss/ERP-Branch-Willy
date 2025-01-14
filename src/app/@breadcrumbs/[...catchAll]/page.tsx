import HomeIcon from "@mui/icons-material/Home";
import { Breadcrumbs, IconButton } from "@mui/joy";
import Link from "next/link";

export default async function HeaderBreadcrumbs(props: {
  params: Promise<{ catchAll: string[] }>;
}) {
  const segments = (await props.params).catchAll;

  return (
    <>
      <Breadcrumbs separator="›" aria-label="breadcrumbs">
        <Link href="/">
          <IconButton size="sm" color="neutral">
            <HomeIcon></HomeIcon>
          </IconButton>
        </Link>
        {segments?.[0] === "settings" && <Link href="/settings">Settings</Link>}
        {/* {segments === undefined && <Link href="/settings">Spaces</Link>} */}
      </Breadcrumbs>
    </>
  );
}
