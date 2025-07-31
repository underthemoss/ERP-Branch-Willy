"use client";

import { graphql } from "@/graphql";
import {
  useGetPurchaseOrderRentalLineItemByIdCreateDialogQuery,
  useUpdateRentalPurchaseOrderLineCreateDialogMutation,
} from "@/graphql/hooks";
import { PimCategoriesTreeView } from "@/ui/pim/PimCategoriesTreeView";
import { Box, Button, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import React from "react";
import { CreateRentalPurchaseOrderLineItemFooter } from "./CreateRentalPurchaseOrderLineItemDialog";

export interface ProductSelectionStepProps {
  lineItemId: string;
  Footer: CreateRentalPurchaseOrderLineItemFooter;
}

const CreateRentalPurchaseOrderLineItemProductSelectionStep: React.FC<
  ProductSelectionStepProps
> = ({ lineItemId, Footer }) => {
  const { data, loading, error, refetch } = useGetPurchaseOrderRentalLineItemByIdCreateDialogQuery({
    variables: { id: lineItemId },
    fetchPolicy: "cache-and-network",
  });

  const [updateLineItem, { loading: mutationLoading }] =
    useUpdateRentalPurchaseOrderLineCreateDialogMutation();
  const item =
    data?.getPurchaseOrderLineItemById?.__typename === "RentalPurchaseOrderLineItem"
      ? data?.getPurchaseOrderLineItemById
      : null;
  return (
    <>
      <DialogTitle>Select a catalog</DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {item?.lineitem_status === "CONFIRMED"
            ? "This product selection cannot be changed after the line item has been added to the purchase order. Please create a new line item if you need a different product."
            : "Search and select a product to add to this purchase order."}
        </Typography>
        <PimCategoriesTreeView
          selectedItemId={item?.so_pim_category?.id}
          disabled={item?.lineitem_status === "CONFIRMED"}
          onItemSelected={async (val) => {
            await updateLineItem({
              variables: {
                input: {
                  id: lineItemId,
                  po_pim_id: val.id,
                },
              },
            });
            await refetch();
          }}
        />
      </DialogContent>
      <Footer nextEnabled={!!item?.po_pim_id} loading={loading || mutationLoading} />
    </>
  );
};

export default CreateRentalPurchaseOrderLineItemProductSelectionStep;
