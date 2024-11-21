import { Box } from "@mui/joy";
import NewButton from "./NewButton";

export const LeftNavigation = () => {
  return (
    <Box display={"flex"} flexDirection={"column"} m={2}>
      <NewButton />
    </Box>
  );
};
