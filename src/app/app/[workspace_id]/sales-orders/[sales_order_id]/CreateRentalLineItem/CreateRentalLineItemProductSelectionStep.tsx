"use client";

import { graphql } from "@/graphql";
import {
  useGetSalesOrderRentalLineItemByIdCreateDialogQuery,
  useUpdateRentalSalesOrderLineCreateDialogMutation,
} from "@/graphql/hooks";
import { PimCategoriesTreeView } from "@/ui/pim/PimCategoriesTreeView";
import { Box, Button, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import React from "react";
import { CreateRentalLineItemFooter } from "./CreateRentalLineItemDialog";

export interface ProductSelectionStepProps {
  lineItemId: string;
  Footer: CreateRentalLineItemFooter;
}

const CreateRentalLineItemProductSelectionStep: React.FC<ProductSelectionStepProps> = ({
  lineItemId,
  Footer,
}) => {
  const { data, loading, error, refetch } = useGetSalesOrderRentalLineItemByIdCreateDialogQuery({
    variables: { id: lineItemId },
    fetchPolicy: "cache-and-network",
  });

  const [updateLineItem, { loading: mutationLoading }] =
    useUpdateRentalSalesOrderLineCreateDialogMutation();
  const item =
    data?.getSalesOrderLineItemById?.__typename === "RentalSalesOrderLineItem"
      ? data?.getSalesOrderLineItemById
      : null;
  return (
    <>
      <DialogTitle>Select a catalog</DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Search and select a product to add to this sales order.
        </Typography>
        <PimCategoriesTreeView
          selectedItemId={item?.so_pim_category?.id}
          onItemSelected={async (val) => {
            await updateLineItem({
              variables: {
                input: {
                  id: lineItemId,
                  so_pim_id: val.id,
                },
              },
            });
            await refetch();
          }}
        />
      </DialogContent>
      <Footer nextEnabled={!!item?.so_pim_id} loading={loading || mutationLoading} />
    </>
  );
};

export default CreateRentalLineItemProductSelectionStep;
