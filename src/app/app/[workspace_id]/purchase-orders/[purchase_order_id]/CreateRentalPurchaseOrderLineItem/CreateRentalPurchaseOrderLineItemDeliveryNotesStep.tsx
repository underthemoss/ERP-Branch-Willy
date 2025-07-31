"use client";

import { graphql } from "@/graphql";
import {
  useGetPurchaseOrderRentalLineItemByIdCreateDialogQuery,
  useUpdateRentalPurchaseOrderLineCreateDialogMutation,
} from "@/graphql/hooks";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";
import type { CreateRentalPurchaseOrderLineItemFooter } from "./CreateRentalPurchaseOrderLineItemDialog";

export interface DeliveryNotesStepProps {
  lineItemId: string;
  Footer: CreateRentalPurchaseOrderLineItemFooter;
}

const CreateRentalPurchaseOrderLineItemDeliveryNotesStep: React.FC<DeliveryNotesStepProps> = ({
  lineItemId,

  Footer,
}) => {
  const [deliveryNotes, setDeliveryNotes] = React.useState<string>("");

  const [updateLineItem, { loading: mutationLoading }] =
    useUpdateRentalPurchaseOrderLineCreateDialogMutation();
  const { data, loading, error } = useGetPurchaseOrderRentalLineItemByIdCreateDialogQuery({
    variables: { id: lineItemId },
    fetchPolicy: "cache-and-network",
  });

  // Initialize deliveryNotes from fetched data
  React.useEffect(() => {
    if (
      data?.getPurchaseOrderLineItemById &&
      "deliveryNotes" in data.getPurchaseOrderLineItemById
    ) {
      setDeliveryNotes(data.getPurchaseOrderLineItemById.deliveryNotes || "");
    }
  }, [data]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateLineItem({
        variables: {
          input: {
            id: lineItemId,
            deliveryNotes: deliveryNotes,
          },
        },
      });
    } catch (err) {
      // Optionally handle error
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle>Delivery Contact & Notes</DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Contact + special instructions for the driver.
        </Typography>
        <TextField
          multiline
          minRows={4}
          fullWidth
          placeholder=""
          value={deliveryNotes}
          onChange={(e) => setDeliveryNotes(e.target.value)}
        />
      </DialogContent>
      <Footer
        nextEnabled={true}
        loading={mutationLoading}
        onNextClick={async () => {
          await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
        }}
      />
    </form>
  );
};

export default CreateRentalPurchaseOrderLineItemDeliveryNotesStep;
