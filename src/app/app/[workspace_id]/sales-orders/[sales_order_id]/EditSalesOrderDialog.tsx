"use client";

import { graphql } from "@/graphql";
import ContactSelector from "@/ui/ContactSelector";
import ProjectSelector from "@/ui/ProjectSelector";
import {
  Alert,
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

interface EditSalesOrderDialogProps {
  open: boolean;
  onClose: () => void;
  salesOrder: {
    id: string;
    buyer_id: string;
    purchase_order_number: string;
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

  // Form state
  const [buyerId, setBuyerId] = React.useState(salesOrder.buyer_id);
  const [poNumber, setPoNumber] = React.useState(salesOrder.purchase_order_number);
  const [projectId, setProjectId] = React.useState(salesOrder.project_id || "");
  const [loading, setLoading] = React.useState(false);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setBuyerId(salesOrder.buyer_id);
      setPoNumber(salesOrder.purchase_order_number);
      setProjectId(salesOrder.project_id || "");
    }
  }, [open, salesOrder]);

  const handleSubmit = async () => {
    setLoading(true);
    // For now, we'll just show an alert since the mutation doesn't exist
    alert(
      "Note: The updateSalesOrder mutation is not yet implemented in the GraphQL schema. " +
        "This would update the sales order with:\n" +
        `- Buyer ID: ${buyerId}\n` +
        `- PO Number: ${poNumber}\n` +
        `- Project ID: ${projectId || "(none)"}`,
    );
    setLoading(false);
    onSuccess?.();
    onClose();

    // When the mutation is available, uncomment this:
    /*
    await updateSalesOrder({
      variables: {
        id: salesOrder.id,
        buyer_id: buyerId,
        purchase_order_number: poNumber,
        project_id: projectId || null,
      },
      refetchQueries: ["GetSalesOrderById"],
    });
    */
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

          {/* PO Number */}
          <TextField
            label="Purchase Order Number"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            required
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

          {/* Note about missing mutation */}
          <Alert severity="info">
            Note: The backend mutation for updating sales orders is not yet implemented. This dialog
            shows the UI that would be used once the mutation is available.
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !buyerId || !poNumber}
        >
          {loading ? "Updating..." : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
