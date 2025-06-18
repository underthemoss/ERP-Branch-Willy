"use client";

import {
  useGetSalesOrderSaleLineItemByIdCreateDialogQuery,
  useUpdateSaleSalesOrderLineCreateDialogMutation,
} from "@/graphql/hooks";
import { PimCategoriesTreeView } from "@/ui/pim/PimCategoriesTreeView";
import { Box, Typography } from "@mui/material";
import React, { useState } from "react";
import { CreateSaleLineItemFooter } from "./CreateSaleLineItemDialog";

interface Props {
  lineItemId: string;
  Footer: CreateSaleLineItemFooter;
}

const CreateSaleLineItemProductSelectionStep: React.FC<Props> = ({ lineItemId, Footer }) => {
  const { data, refetch } = useGetSalesOrderSaleLineItemByIdCreateDialogQuery({
    variables: { id: lineItemId },
    fetchPolicy: "cache-and-network",
  });
  const [updateItem] = useUpdateSaleSalesOrderLineCreateDialogMutation();

  if (data?.getSalesOrderLineItemById?.__typename !== "SaleSalesOrderLineItem") {
    return null;
  }
  const item = data.getSalesOrderLineItemById;
  return (
    <Box>
      <Box p={3}>
        <Typography variant="h6" gutterBottom>
          Select Product
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select a product to add to this sales order.
        </Typography>
        <Box sx={{ mb: 3 }}>
          <PimCategoriesTreeView
            onItemSelected={async (val) => {
              await updateItem({
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
        </Box>
      </Box>
      <Footer nextEnabled={Boolean(item.so_pim_id)} loading={false} onNextClick={async () => {}} />
    </Box>
  );
};

export default CreateSaleLineItemProductSelectionStep;
