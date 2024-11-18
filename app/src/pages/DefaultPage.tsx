import { Outlet } from "react-router-dom";
import { Box, Sheet } from "@mui/joy";

export const DefaultPage = () => {
  return (
    <Box display={"flex"} flexDirection={"column"} style={{ height: "100%" }}>
      <Box height={60} display={"flex"}>
        <Sheet style={{ flex: 1 }} variant="soft">
          Header
        </Sheet>
      </Box>
      <Box flex={1} display={"flex"}>
        <Box display={"flex"} width={220}>
          <Sheet style={{ flex: 1 }} variant="soft">
            Left nav
          </Sheet>
        </Box>
        <Box>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};
