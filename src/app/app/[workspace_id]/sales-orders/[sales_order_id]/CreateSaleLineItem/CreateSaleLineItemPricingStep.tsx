"use client";

import {
  useGetPricesSaleCreateDialogQuery,
  useGetSalesOrderSaleLineItemByIdCreateDialogQuery,
  useUpdateSaleSalesOrderLineCreateDialogMutation,
} from "@/graphql/hooks";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Box, Divider, MenuItem, Select, Typography } from "@mui/material";
import { useParams } from "next/navigation";
import React, { useEffect } from "react";
import { CreateSaleLineItemFooter } from "./CreateSaleLineItemDialog";

interface Props {
  lineItemId: string;
  Footer: CreateSaleLineItemFooter;
}

const CreateSaleLineItemPricingStep: React.FC<Props> = ({ lineItemId, Footer }) => {
  const params = useParams();

  const workspace_id = params?.workspace_id || "";
  const [selectedPriceId, setSelectedPriceId] = React.useState<string | null>(null);
  // Quantity state
  const [quantity, setQuantity] = React.useState<number>(1);

  const { data } = useGetSalesOrderSaleLineItemByIdCreateDialogQuery({
    variables: { id: lineItemId },
    fetchPolicy: "cache-and-network",
  });
  const { data: pricesData, loading: pricesLoading } = useGetPricesSaleCreateDialogQuery({
    variables: {},
    fetchPolicy: "cache-and-network",
  });
  const [updateItem] = useUpdateSaleSalesOrderLineCreateDialogMutation();

  // Filter prices to match the line item's product or category
  const lineItem = data?.getSalesOrderLineItemById;
  const isSaleLineItem = lineItem?.__typename === "SaleSalesOrderLineItem";
  const lineItemProductOrCat = isSaleLineItem ? lineItem?.so_pim_id : undefined;
  const item = isSaleLineItem ? lineItem : undefined;

  useEffect(() => {
    setQuantity(item?.so_quantity || 1);
    setSelectedPriceId(item?.price_id || null);
  }, [data]);

  const prices =
    pricesData?.listPrices?.items?.filter((item) => {
      if (item.__typename !== "SalePrice") return false;
      return (
        item.pimCategoryId === lineItemProductOrCat || item.pimProductId === lineItemProductOrCat
      );
    }) || [];

  // Helper to format cents to dollars with commas
  const formatCentsToUSD = (cents: number) =>
    cents != null
      ? `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "-";

  return (
    <Box>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Set Pricing
        </Typography>
        {pricesLoading ? (
          <Typography variant="body2" color="text.secondary">
            Loading price options...
          </Typography>
        ) : prices.length === 0 ? (
          <Typography variant="body2" color="error">
            No price options available.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {prices.map((price) => {
              if (price.__typename !== "SalePrice") return null;
              return (
                <Box
                  key={price.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "1px solid",
                    borderColor: selectedPriceId === price.id ? "primary.main" : "grey.300",
                    borderRadius: 2,
                    px: 2,
                    py: 1.5,
                    cursor: "pointer",
                    background:
                      selectedPriceId === price.id
                        ? "rgba(25, 118, 210, 0.04)"
                        : "background.paper",
                  }}
                  onClick={() => setSelectedPriceId(price.id)}
                  data-testid={`price-option-${price.id}`}
                >
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <input
                        type="radio"
                        checked={selectedPriceId === price.id}
                        onChange={() => setSelectedPriceId(price.id)}
                        style={{ marginRight: 8 }}
                        name="price-option"
                      />
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {price.pimProduct?.name || price.pimCategory?.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                      {price.priceBook?.id && price.priceBook?.name ? (
                        <a
                          href={`/app/${workspace_id}/prices/price-books/${price.priceBook.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#1976d2",
                            textDecoration: "underline",
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {price.priceBook.name}
                          <OpenInNewIcon fontSize="inherit" sx={{ ml: 0.5, fontSize: 16 }} />
                        </a>
                      ) : (
                        price.priceBook?.name || "-"
                      )}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {formatCentsToUSD(price.unitCostInCents)}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
      <Divider sx={{ m: 2 }} />
      {/* Select Quantity Dropdown */}
      <Box sx={{ px: 3, pb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Select Quantity
        </Typography>
        <Select
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          fullWidth
          displayEmpty
          variant="outlined"
          data-testid="select-quantity"
          sx={{
            fontSize: "1.25rem",
            background: "background.paper",
            borderRadius: 2,
          }}
          MenuProps={{
            PaperProps: {
              style: { maxHeight: 300 },
            },
          }}
        >
          {Array.from({ length: 100 }, (_, i) => i + 1).map((val) => (
            <MenuItem key={val} value={val}>
              {val}
            </MenuItem>
          ))}
        </Select>
      </Box>
      <Footer
        nextEnabled={quantity > 0 && !!selectedPriceId}
        loading={pricesLoading}
        onNextClick={async () => {
          await updateItem({
            variables: {
              input: {
                id: lineItemId,
                so_quantity: quantity,
                price_id: selectedPriceId,
              },
            },
          });
        }}
      />
    </Box>
  );
};

export default CreateSaleLineItemPricingStep;
