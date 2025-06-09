"use client";

import { Box, Typography } from "@mui/material";
import { useParams } from "next/navigation";

export default function PurchaseOrderDisplayPage() {
  const params = useParams<{ purchase_order_id: string }>();
  const purchaseOrderId = params?.purchase_order_id;

  return (
    <Box maxWidth={600} mx="auto" mt={6} p={4}>
      <Typography variant="h4" gutterBottom>
        Purchase Order #{purchaseOrderId}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        This is a stub page for displaying a purchase order.
      </Typography>
    </Box>
  );
}
