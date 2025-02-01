import { Box, Typography } from "@mui/joy";

export default function Page() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        bgcolor: "background.body",
        p: 3,
      }}
    >
      <Typography
        level="h1"
        component="h1"
        sx={{
          fontSize: "3rem",
          mb: 2,
          color: "text.primary",
        }}
      >
        Could not authenticate
      </Typography>
      <Typography
        level="body-md"
        sx={{
          mb: 4,
          textAlign: "center",
          maxWidth: 400,
        }}
      >
        Please try again or contact support.
      </Typography>
    </Box>
  );
}
