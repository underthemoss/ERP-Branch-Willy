"use client";

import { PurchaseOrderStatus } from "@/graphql/graphql";
import { Box, Button, Paper, Typography } from "@mui/material";
import * as React from "react";
import PurchaseOrderLineItemsDataGrid from "./PurchaseOrderLineItemsDataGrid";

interface OrderItemsSectionProps {
  purchaseOrderId: string;
  purchaseOrderStatus: PurchaseOrderStatus;
}

const OrderItemsSection: React.FC<OrderItemsSectionProps> = ({
  purchaseOrderId,
  purchaseOrderStatus,
}) => {
  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3, mt: 3 }}>
      <PurchaseOrderLineItemsDataGrid
        purchaseOrderId={purchaseOrderId}
        purchaseOrderStatus={purchaseOrderStatus}
      />
    </Paper>
  );
};

export default OrderItemsSection;
