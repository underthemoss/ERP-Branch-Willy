"use client";

import { Box, Typography } from "@mui/material";
import { PageContainer } from "@toolpad/core";
import FulfillmentDashboard from "./FulfillmentDashboard";

export default function Page() {
  return (
    <Box display={"flex"} height={"100%"} overflow={"hidden"} flex={1} flexDirection={"column"}>
      <Box>
        <Typography variant="h1" fontWeight={700} mb={1}>
          Fulfillment
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" mb={3}>
          Manage and fulfill sales across workflows.
        </Typography>
      </Box>
      <Box display={"flex"} flex={1}>
        <FulfillmentDashboard />
      </Box>
    </Box>
  );
}
