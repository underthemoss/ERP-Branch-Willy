"use client";

import { graphql } from "@/graphql";
import { useUpdatePurchaseOrderMutation } from "@/graphql/hooks";
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
import React, { useState } from "react";

// GQL mutation declaration (for codegen)
graphql(`
  mutation UpdatePurchaseOrder($input: UpdatePurchaseOrderInput!) {
    updatePurchaseOrder(input: $input) {
      id
      seller_id
      purchase_order_number
      project_id
    }
  }
`);

interface EditPurchaseOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  purchaseOrder: {
    id: string;
    seller_id: string;
    purchase_order_number: string;
    project_id?: string | null;
  };
}

export const EditPurchaseOrderDialog: React.FC<EditPurchaseOrderDialogProps> = ({
  open,
  onClose,
  onSuccess,
  purchaseOrder,
}) => {
  const params = useParams<{ workspace_id: string }>();
  const workspaceId = params?.workspace_id || "";

  const [sellerId, setSellerId] = useState<string>(purchaseOrder.seller_id);
  const [projectId, setProjectId] = useState<string | undefined>(
    purchaseOrder.project_id || undefined,
  );
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState<string>(
    purchaseOrder.purchase_order_number,
  );
  const [error, setError] = useState<string | null>(null);

  const [updatePurchaseOrder, { loading }] = useUpdatePurchaseOrderMutation();

  const handleClose = () => {
    setSellerId(purchaseOrder.seller_id);
    setProjectId(purchaseOrder.project_id || undefined);
    setPurchaseOrderNumber(purchaseOrder.purchase_order_number);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!sellerId || !purchaseOrderNumber.trim()) {
      setError("Seller and purchase order number are required.");
      return;
    }
    try {
      const input = {
        id: purchaseOrder.id,
        seller_id: sellerId,
        purchase_order_number: purchaseOrderNumber.trim(),
        ...(projectId && { project_id: projectId }),
      };

      await updatePurchaseOrder({
        variables: { input },
        refetchQueries: ["GetPurchaseOrderById"],
        awaitRefetchQueries: true,
      });

      handleClose();
      onSuccess();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Purchase Order</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box>
            <Typography fontWeight={600} mb={1}>
              Purchase Order Number <span style={{ color: "#d32f2f" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={purchaseOrderNumber}
              onChange={(e) => setPurchaseOrderNumber(e.target.value)}
              placeholder="Enter purchase order number"
            />
          </Box>
          <Box>
            <Typography fontWeight={600} mb={1}>
              Seller <span style={{ color: "#d32f2f" }}>*</span>
            </Typography>
            <ContactSelector
              contactId={sellerId}
              onChange={setSellerId}
              workspaceId={workspaceId}
            />
          </Box>
          <Box>
            <Typography fontWeight={600} mb={1}>
              Project
            </Typography>
            <ProjectSelector projectId={projectId} onChange={setProjectId} />
          </Box>
          {error && (
            <Typography color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? "Updating..." : "Update"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditPurchaseOrderDialog;
