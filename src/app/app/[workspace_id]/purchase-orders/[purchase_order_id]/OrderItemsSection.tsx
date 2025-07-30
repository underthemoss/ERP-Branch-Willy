"use client";

import { PurchaseOrderStatus } from "@/graphql/graphql";
import { Box, Button, Paper, Typography } from "@mui/material";
import * as React from "react";
import PurchaseOrderLineItemsDataGrid from "./PurchaseOrderLineItemsDataGrid";
import PurchaseOrderTransactionTypeSelectDialog, {
  TransactionType,
} from "./PurchaseOrderTransactionTypeSelectDialog";

interface OrderItemsSectionProps {
  purchaseOrderId: string;
  purchaseOrderStatus: PurchaseOrderStatus;
}

type DialogState = "none" | "type" | "rental" | "sale";

const OrderItemsSection: React.FC<OrderItemsSectionProps> = ({
  purchaseOrderId,
  purchaseOrderStatus,
}) => {
  // Dialog state for add item flow
  const [openDialog, setOpenDialog] = React.useState<DialogState>("none");
  const [lineItemId, setLineItemId] = React.useState<string | null>(null);

  const handleTypeSelect = (type: TransactionType, lineItemId?: string) => {
    if (type === "rental" && lineItemId) {
      setLineItemId(lineItemId);
      setOpenDialog("rental");
    } else if (type === "sale" && lineItemId) {
      setOpenDialog("sale");
      setLineItemId(lineItemId);
    } else setOpenDialog("none");
  };

  const handleEditItem = (
    itemId: string,
    itemType: "RentalPurchaseOrderLineItem" | "SalePurchaseOrderLineItem",
  ) => {
    setLineItemId(itemId);
    if (itemType === "RentalPurchaseOrderLineItem") {
      setOpenDialog("rental");
    } else if (itemType === "SalePurchaseOrderLineItem") {
      setOpenDialog("sale");
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog("none");
  };

  return (
    <>
      {/* Dialogs for add item flow */}
      <PurchaseOrderTransactionTypeSelectDialog
        open={openDialog === "type"}
        onClose={() => setOpenDialog("none")}
        onSelect={handleTypeSelect}
        purchaseOrderId={purchaseOrderId}
      />

      <Paper elevation={2} sx={{ p: 2, mb: 3, mt: 3 }}>
        <PurchaseOrderLineItemsDataGrid
          key={`${purchaseOrderId}-${openDialog}`}
          purchaseOrderId={purchaseOrderId}
          onAddNewItem={() => setOpenDialog("type")}
          onEditItem={handleEditItem}
          purchaseOrderStatus={purchaseOrderStatus}
        />
      </Paper>
    </>
  );
};

export default OrderItemsSection;
