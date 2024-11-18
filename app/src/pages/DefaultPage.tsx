import { Outlet, useSearchParams } from "react-router-dom";
import { Box, Sheet } from "@mui/joy";
import { client } from "../api/generated";
import { useEffect } from "react";

export const DefaultPage = () => {
  const [searchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("jwt")) {
      const isProduction = process.env.NODE_ENV === "production";
      const bearerToken = `Bearer ${searchParams.get("jwt")}`;
      client.setConfig({
        baseUrl: isProduction ? "/resource-planning" : "http://localhost:5000",
        headers: {
          Authorization: bearerToken,
        },
      });
    }
  }, [searchParams]);

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
