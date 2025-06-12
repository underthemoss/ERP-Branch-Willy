"use client";

import * as React from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import SalesOrderLineItemsDataGrid from "./SalesOrderLineItemsDataGrid";
import TransactionTypeSelectDialog, { TransactionType } from "@/ui/TransactionTypeSelectDialog";
import CreateSOLineItemDialog from "./CreateSOLineItemDialog";
import CreateSaleLineItemDialog from "@/ui/CreateSaleLineItemDialog";
import CreateTransferLineItemDialog from "@/ui/CreateTransferLineItemDialog";

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
      <CreateSOLineItemDialog
        open={rentalDialogOpen}
        onClose={() => setRentalDialogOpen(false)}
        salesOrderId={salesOrderId}
        onSuccess={() => setRentalDialogOpen(false)}
      />
      <CreateSaleLineItemDialog
        open={saleDialogOpen}
        onClose={() => setSaleDialogOpen(false)}
      />
      <CreateTransferLineItemDialog
        open={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
      />

      <Paper elevation={2} sx={{ p: 2, mb: 3, mt: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" gutterBottom>
            Order Items
          </Typography>
          <Button
            variant="contained"
            onClick={() => setTypeDialogOpen(true)}
            sx={{ ml: 2 }}
          >
            Add New Item
          </Button>
        </Box>
        <SalesOrderLineItemsDataGrid salesOrderId={salesOrderId} />
      </Paper>
    </>
  );
};

export default OrderItemsSection;
