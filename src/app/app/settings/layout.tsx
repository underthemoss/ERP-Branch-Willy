import { Box, Typography } from "@mui/joy";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Box p={2}>
      <Box>{children}</Box>
    </Box>
  );
}
