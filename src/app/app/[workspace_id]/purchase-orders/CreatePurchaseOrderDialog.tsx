// "use client";
import { graphql } from "@/graphql";
import { useCreatePurchaseOrderMutation } from "@/graphql/hooks";
import ContactSelector from "@/ui/ContactSelector";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useParams } from "next/navigation";
import React, { useState } from "react";

// GQL mutation declaration (for codegen, if not already present)
graphql(`
  mutation createPurchaseOrder($input: PurchaseOrderInput) {
    createPurchaseOrder(input: $input) {
      id
    }
  }
`);

interface CreatePurchaseOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (purchaseOrderId: string) => void;
}

export const CreatePurchaseOrderDialog: React.FC<CreatePurchaseOrderDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const params = useParams<{ workspace_id: string }>();
  const workspaceId = params?.workspace_id || "";

  const [buyerContactId, setBuyerContactId] = useState<string>("");
  const [sellerContactId, setSellerContactId] = useState<string>("");
  const [requestorContactId, setRequestorContactId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [createPurchaseOrder, { loading }] = useCreatePurchaseOrderMutation();

  const handleClose = () => {
    setBuyerContactId("");
    setSellerContactId("");
    setRequestorContactId("");
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!buyerContactId || !sellerContactId) {
      setError("Buyer and seller contacts are required.");
      return;
    }
    try {
      const input: Record<string, string> = {
        buyer_contact_id: buyerContactId,
        seller_contact_id: sellerContactId,
      };
      if (requestorContactId) {
        input.requester_contact_id = requestorContactId;
      }
      const res = await createPurchaseOrder({
        variables: {
          input,
        },
      });
      const newId = res.data?.createPurchaseOrder?.id;
      if (newId) {
        handleClose();
        onSuccess(newId);
      } else {
        setError("Failed to create purchase order.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Purchase Order</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box display="flex" gap={2}>
            <Box flex={1}>
              <Typography fontWeight={600}>
                Buyer Contact <span style={{ color: "#d32f2f" }}>*</span>
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                The contact who is purchasing. Required.
              </Typography>
              <ContactSelector
                contactId={buyerContactId}
                onChange={setBuyerContactId}
                workspaceId={workspaceId}
              />
            </Box>
            <Box flex={1}>
              <Typography fontWeight={600}>
                Seller (Vendor) Contact <span style={{ color: "#d32f2f" }}>*</span>
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                The contact who is selling (vendor). Required.
              </Typography>
              <ContactSelector
                contactId={sellerContactId}
                onChange={setSellerContactId}
                workspaceId={workspaceId}
              />
            </Box>
          </Box>
          <Box>
            <Typography fontWeight={600}>Requestor Contact</Typography>
            <Typography variant="body2" color="text.secondary" mb={1}>
              The contact who is requesting the purchase. Optional.
            </Typography>
            <ContactSelector
              contactId={requestorContactId}
              onChange={setRequestorContactId}
              workspaceId={workspaceId}
            />
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
            {loading ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreatePurchaseOrderDialog;
