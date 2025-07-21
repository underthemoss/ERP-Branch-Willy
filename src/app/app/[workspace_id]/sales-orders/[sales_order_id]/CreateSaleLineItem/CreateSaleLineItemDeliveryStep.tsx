"use client";

import {
  useGetSalesOrderSaleLineItemByIdCreateDialogQuery,
  useUpdateSaleSalesOrderLineCreateDialogMutation,
} from "@/graphql/hooks";
import { Box, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import React from "react";
import type { CreateSaleLineItemFooter } from "./CreateSaleLineItemDialog";

export interface DeliveryStepProps {
  lineItemId: string;
  Footer: CreateSaleLineItemFooter;
}

const CreateSaleLineItemDeliveryStep: React.FC<DeliveryStepProps> = ({ lineItemId, Footer }) => {
  const [deliveryNotes, setDeliveryNotes] = React.useState<string>("");

  const [updateLineItem, { loading: mutationLoading }] =
    useUpdateSaleSalesOrderLineCreateDialogMutation();

  const { data, loading, error } = useGetSalesOrderSaleLineItemByIdCreateDialogQuery({
    variables: { id: lineItemId },
    fetchPolicy: "cache-and-network",
  });

  // Initialize deliveryNotes from fetched data
  React.useEffect(() => {
    if (
      data?.getSalesOrderLineItemById &&
      data.getSalesOrderLineItemById.__typename === "SaleSalesOrderLineItem" &&
      data.getSalesOrderLineItemById.deliveryNotes
    ) {
      setDeliveryNotes(data.getSalesOrderLineItemById.deliveryNotes);
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
      <DialogTitle>Delivery Information</DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Add delivery contact information and special instructions for the sale item.
        </Typography>
        <TextField
          multiline
          minRows={4}
          fullWidth
          placeholder="Enter delivery notes, contact information, and any special instructions..."
          value={deliveryNotes}
          onChange={(e) => setDeliveryNotes(e.target.value)}
          label="Delivery Notes"
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

export default CreateSaleLineItemDeliveryStep;
