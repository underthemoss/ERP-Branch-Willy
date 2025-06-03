"use client";

import { useParams } from "next/navigation";
import { Box, Typography, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import * as React from "react";

export default function SalesOrderDetailPage() {
  const { sales_order_id, workspace_id } = useParams<{
    sales_order_id: string;
    workspace_id: string;
  }>();
  const router = useRouter();

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 8, p: 4, textAlign: "center" }}>
      <Typography variant="h4" gutterBottom>
        Sales Order Created
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Your sales order has been created successfully.
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4 }}>
        Sales Order ID: <b>{sales_order_id}</b>
      </Typography>
      <Button
        variant="contained"
        onClick={() => router.push(`/app/${workspace_id}/sales-orders`)}
      >
        Back to Sales Orders
      </Button>
    </Box>
  );
}
