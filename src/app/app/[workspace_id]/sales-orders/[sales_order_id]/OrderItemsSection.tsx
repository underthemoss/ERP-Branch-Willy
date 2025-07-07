"use client";

import { SalesOrderStatus } from "@/graphql/graphql";
import { Box, Button, Paper, Typography } from "@mui/material";
import * as React from "react";
import CreateRentalLineItemDialog from "./CreateRentalLineItem/CreateRentalLineItemDialog";
import CreateSaleLineItemDialog from "./CreateSaleLineItem/CreateSaleLineItemDialog";
import CreateTransferLineItemDialog from "./CreateTransferLineItemDialog";
import SalesOrderLineItemsDataGrid from "./SalesOrderLineItemsDataGrid";
import TransactionTypeSelectDialog, { TransactionType } from "./TransactionTypeSelectDialog";

interface OrderItemsSectionProps {
  salesOrderId: string;
  salesOrderStatus: SalesOrderStatus;
}

type DialogState = "none" | "type" | "rental" | "sale" | "transfer";
const OrderItemsSection: React.FC<OrderItemsSectionProps> = ({
  salesOrderId,
  salesOrderStatus,
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
    } else if (type === "transfer") setOpenDialog("transfer");
    else setOpenDialog("none");
  };

  const handleCloseDialog = () => {
    setOpenDialog("none");
  };

  return (
    <>
      {/* Dialogs for add item flow */}
      <TransactionTypeSelectDialog
        open={openDialog === "type"}
        onClose={() => setOpenDialog("none")}
        onSelect={handleTypeSelect}
        salesOrderId={salesOrderId}
      />
      <CreateRentalLineItemDialog
        key={`${salesOrderId}-${openDialog}-rental`}
        open={openDialog === "rental"}
        onClose={() => {
          setOpenDialog("none");
          setLineItemId(null);
        }}
        lineItemId={lineItemId || ""}
        onSuccess={() => {
          setOpenDialog("none");
          setLineItemId(null);
        }}
      />
      <CreateSaleLineItemDialog
        open={openDialog === "sale"}
        onClose={handleCloseDialog}
        lineItemId={lineItemId || ""}
        onSuccess={() => {}}
      />
      <CreateTransferLineItemDialog
        open={openDialog === "transfer"}
        onClose={() => setOpenDialog("none")}
      />

      <Paper elevation={2} sx={{ p: 2, mb: 3, mt: 3 }}>
        <SalesOrderLineItemsDataGrid
          key={`${salesOrderId}-${openDialog}`}
          salesOrderId={salesOrderId}
          onAddNewItem={() => setOpenDialog("type")}
          salesOrderStatus={salesOrderStatus}
        />
      </Paper>
    </>
  );
};

export default OrderItemsSection;
