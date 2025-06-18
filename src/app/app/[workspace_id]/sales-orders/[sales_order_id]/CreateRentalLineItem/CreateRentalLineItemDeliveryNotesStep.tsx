"use client";

import { graphql } from "@/graphql";
import {
  useGetSalesOrderRentalLineItemByIdCreateDialogQuery,
  useUpdateRentalSalesOrderLineCreateDialogMutation,
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
import type { CreateRentalLineItemFooter } from "./CreateRentalLineItemDialog";

export interface DeliveryNotesStepProps {
  lineItemId: string;
  Footer: CreateRentalLineItemFooter;
}

const CreateRentalLineItemDeliveryNotesStep: React.FC<DeliveryNotesStepProps> = ({
  lineItemId,

  Footer,
}) => {
  const [deliveryNotes, setDeliveryNotes] = React.useState<string>("");

  const [updateLineItem, { loading: mutationLoading }] =
    useUpdateRentalSalesOrderLineCreateDialogMutation();
  const { data, loading, error } = useGetSalesOrderRentalLineItemByIdCreateDialogQuery({
    variables: { id: lineItemId },
    fetchPolicy: "cache-and-network",
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateLineItem({
        variables: {
          input: {
            id: lineItemId,
            delivery_location: deliveryNotes,
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

export default CreateRentalLineItemDeliveryNotesStep;
