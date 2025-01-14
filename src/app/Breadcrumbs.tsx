import HomeIcon from "@mui/icons-material/Home";
import { Breadcrumbs, IconButton } from "@mui/joy";
import Link from "next/link";

export default async function HeaderBreadcrumbs(props: {
  params: Promise<any>;
}) {
  console.log(await props.params);

  return (
    <>
      <Breadcrumbs separator="›" aria-label="breadcrumbs">
        <Link href="/">
          <IconButton size="sm" color="neutral">
            <HomeIcon></HomeIcon>
          </IconButton>
        </Link>
        {<Link href="/settings">Settings</Link>}
        <Link href="/">Home</Link>
        <Link href="/">Home</Link>
      </Breadcrumbs>
    </>
  );
}
