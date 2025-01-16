import { useAuth } from "@/lib/auth";
import { NextLink } from "@/ui/NextLink";
import { Box, Typography } from "@mui/joy";

export default async function Page(props: {
  params: Promise<{ item_id: string }>;
}) {
  const { user } = await useAuth();

  return (
    <>
      <Box>
        <Typography level="h1" fontWeight={500}>
          Settings
        </Typography>
      </Box>
      <Box mt={2}>
        <NextLink href={"/app/settings/content-types"}>Content Types</NextLink>
      </Box>
    </>
  );
}
