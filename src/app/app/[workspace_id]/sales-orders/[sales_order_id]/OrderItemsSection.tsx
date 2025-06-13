"use client";

import { Box, Button, Paper, Typography } from "@mui/material";
import * as React from "react";
import CreateRentalLineItemDialog from "./CreateRentalLineItemDialog";
import CreateSaleLineItemDialog from "./CreateSaleLineItemDialog";
import CreateTransferLineItemDialog from "./CreateTransferLineItemDialog";
import SalesOrderLineItemsDataGrid from "./SalesOrderLineItemsDataGrid";
import TransactionTypeSelectDialog, { TransactionType } from "./TransactionTypeSelectDialog";

interface OrderItemsSectionProps {
  salesOrderId: string;
}

const OrderItemsSection: React.FC<OrderItemsSectionProps> = ({ salesOrderId }) => {
  // Dialog state for add item flow
  const [typeDialogOpen, setTypeDialogOpen] = React.useState(false);
  const [rentalDialogOpen, setRentalDialogOpen] = React.useState(false);
  const [saleDialogOpen, setSaleDialogOpen] = React.useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = React.useState(false);

  const handleTypeSelect = (type: TransactionType) => {
    setTypeDialogOpen(false);
    if (type === "rental") setRentalDialogOpen(true);
    else if (type === "sale") setSaleDialogOpen(true);
    else if (type === "transfer") setTransferDialogOpen(true);
  };

  return (
    <>
      {/* Dialogs for add item flow */}
      <TransactionTypeSelectDialog
        open={typeDialogOpen}
        onClose={() => setTypeDialogOpen(false)}
        onSelect={handleTypeSelect}
      />
      <CreateRentalLineItemDialog
        key={`${salesOrderId}-${rentalDialogOpen}-${saleDialogOpen}-${transferDialogOpen}`}
        open={rentalDialogOpen}
        onClose={() => setRentalDialogOpen(false)}
        salesOrderId={salesOrderId}
        onSuccess={() => setRentalDialogOpen(false)}
      />
      <CreateSaleLineItemDialog open={saleDialogOpen} onClose={() => setSaleDialogOpen(false)} />
      <CreateTransferLineItemDialog
        open={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
      />

      <Paper elevation={2} sx={{ p: 2, mb: 3, mt: 3 }}>
        <SalesOrderLineItemsDataGrid
          key={`${salesOrderId}-${rentalDialogOpen}-${saleDialogOpen}-${transferDialogOpen}`}
          salesOrderId={salesOrderId}
          onAddNewItem={() => setTypeDialogOpen(true)}
        />
      </Paper>
    </>
  );
};

export default OrderItemsSection;
