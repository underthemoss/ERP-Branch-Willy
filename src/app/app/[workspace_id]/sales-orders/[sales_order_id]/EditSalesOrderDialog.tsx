"use client";

import { graphql } from "@/graphql";
import { useUpdateSalesOrderMutation } from "@/graphql/hooks";
import ContactSelector from "@/ui/ContactSelector";
import ProjectSelector from "@/ui/ProjectSelector";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useParams } from "next/navigation";
import * as React from "react";

graphql(`
  mutation UpdateSalesOrder($input: UpdateSalesOrderInput) {
    updateSalesOrder(input: $input) {
      id
      buyer_id
      purchase_order_number
      project_id
      sales_order_number
    }
  }
`);

interface EditSalesOrderDialogProps {
  open: boolean;
  onClose: () => void;
  salesOrder: {
    id: string;
    buyer_id: string;
    purchase_order_number: string;
    sales_order_number: string;
    project_id?: string | null;
  };
  onSuccess?: () => void;
}

export default function EditSalesOrderDialog({
  open,
  onClose,
  salesOrder,
  onSuccess,
}: EditSalesOrderDialogProps) {
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const [updateSalesOrder] = useUpdateSalesOrderMutation();

  // Form state
  const [buyerId, setBuyerId] = React.useState(salesOrder.buyer_id);
  const [poNumber, setPoNumber] = React.useState(salesOrder.purchase_order_number);
  const [salesOrderNumber, setSalesOrderNumber] = React.useState(salesOrder.sales_order_number);
  const [projectId, setProjectId] = React.useState(salesOrder.project_id || "");
  const [loading, setLoading] = React.useState(false);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setBuyerId(salesOrder.buyer_id);
      setPoNumber(salesOrder.purchase_order_number);
      setSalesOrderNumber(salesOrder.sales_order_number);
      setProjectId(salesOrder.project_id || "");
    }
  }, [open, salesOrder]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await updateSalesOrder({
        variables: {
          input: {
            id: salesOrder.id,
            buyer_id: buyerId,
            purchase_order_number: poNumber.trim() || null,
            sales_order_number: salesOrderNumber,
            project_id: projectId || null,
          },
        },
        refetchQueries: ["GetSalesOrderById"],
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error updating sales order:", error);
      alert("Failed to update sales order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Sales Order</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}>
          {/* Buyer Selector */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Buyer *
            </Typography>
            <ContactSelector
              contactId={buyerId}
              onChange={(value) => setBuyerId(value || "")}
              workspaceId={workspace_id}
            />
          </Box>

          {/* Sales Order Number */}
          <TextField
            label="Sales Order Number"
            value={salesOrderNumber}
            onChange={(e) => setSalesOrderNumber(e.target.value)}
            required
            fullWidth
          />

          {/* PO Number */}
          <TextField
            label="Purchase Order Number (optional)"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            placeholder="Enter purchase order number"
            fullWidth
          />

          {/* Project Selector */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Project (Optional)
            </Typography>
            <ProjectSelector
              projectId={projectId}
              onChange={(value) => setProjectId(value || "")}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !buyerId || !salesOrderNumber}
        >
          {loading ? "Updating..." : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
