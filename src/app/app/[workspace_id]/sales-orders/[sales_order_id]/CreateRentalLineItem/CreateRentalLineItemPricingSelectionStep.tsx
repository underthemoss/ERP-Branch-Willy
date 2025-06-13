"use client";

import { graphql } from "@/graphql";
import {
  useGetPricesCreateDialogQuery,
  useGetSalesOrderRentalLineItemByIdCreateDialogQuery,
  useUpdateRentalSalesOrderLineCreateDialogMutation,
} from "@/graphql/hooks";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { CreateRentalLineItemFooter } from "./CreateRentalLineItemDialog";

type CustomPriceInputProps = {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
};

const CustomPriceInput: React.FC<CustomPriceInputProps> = ({ value, onChange, placeholder }) => (
  <TextField
    size="small"
    value={value}
    onChange={(e) => {
      const val = e.target.value.replace(/[^0-9.]/g, "");
      onChange(val);
    }}
    sx={{ maxWidth: 120 }}
    onBlur={(ev) => onChange(formatCentsToUSD(Number(ev.target.value) * 100))}
    InputProps={{
      startAdornment: <InputAdornment position="start">$</InputAdornment>,
      inputMode: "decimal",
    }}
    placeholder={placeholder || "0.00"}
  />
);

const formatCentsToUSD = (cents: number | null): string => {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2);
};

type PriceOption = {
  id: string;
  name: string;
  pricePerDayInCents?: number;
  pricePerWeekInCents?: number;
  pricePerMonthInCents?: number;
  priceBook?: {
    id: string;
    name: string;
  } | null;
};

export interface PricingSelectionStepProps {
  lineItemId: string;
  Footer: CreateRentalLineItemFooter;
}

const CreateRentalLineItemPricingSelectionStep: React.FC<PricingSelectionStepProps> = ({
  lineItemId,
  Footer,
}) => {
  const params = useParams();
  const workspace_id = params?.workspace_id as string;
  const [updateLineItem, { loading: mutationLoading }] =
    useUpdateRentalSalesOrderLineCreateDialogMutation();
  const { data, loading, error, refetch } = useGetSalesOrderRentalLineItemByIdCreateDialogQuery({
    variables: { id: lineItemId },
    fetchPolicy: "cache-and-network",
  });

  const { data: pricesData, loading: pricesLoading } = useGetPricesCreateDialogQuery({
    variables: {},
    fetchPolicy: "cache-and-network",
  });

  const [selectedPrice, setSelectedPrice] = useState("");
  const [customDay, setCustomDay] = useState("");
  const [customWeek, setCustomWeek] = useState("");
  const [customMonth, setCustomMonth] = useState("");

  const prices = pricesData?.listPrices?.items || [];

  const item =
    data?.getSalesOrderLineItemById?.__typename === "RentalSalesOrderLineItem"
      ? data.getSalesOrderLineItemById
      : null;
  useEffect(() => {
    const hasCustomPrice =
      !!item?.price_per_day_in_cents &&
      !!item?.price_per_week_in_cents &&
      !!item?.price_per_month_in_cents;

    console.log({ hasCustomPrice });
    if (hasCustomPrice && !item.price_id) {
      setSelectedPrice("custom");
    } else {
      setSelectedPrice(item?.price_id || "");
    }
    setCustomDay(formatCentsToUSD(Number(item?.price_per_day_in_cents?.toString()) || 0) || "");
    setCustomWeek(formatCentsToUSD(Number(item?.price_per_week_in_cents?.toString()) || 0) || "");
    setCustomMonth(formatCentsToUSD(Number(item?.price_per_month_in_cents?.toString()) || 0) || "");
  }, [data]);

  const customPrice: PriceOption = {
    id: "custom",
    name: "Custom Price",
  };

  const rentalPrices: PriceOption[] = [
    ...prices
      ?.map((p) => (p.__typename === "RentalPrice" ? p : null))
      .filter(Boolean)
      .filter((p) => p?.pimCategoryId === item?.so_pim_id || p?.pimProductId === item?.so_pim_id)
      .map((p) => ({
        id: p?.id || "",
        name: p?.id || "",
        priceBook: p?.priceBook || undefined,
        pricePerDayInCents: p?.pricePerDayInCents,
        pricePerWeekInCents: p?.pricePerWeekInCents,
        pricePerMonthInCents: p?.pricePerMonthInCents,
      })),
    customPrice,
  ];

  return (
    <>
      <DialogTitle>Select pricing</DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 0 }}>
        <Box sx={{ display: "flex", mb: 2, fontWeight: 600 }}>
          <Box sx={{ flex: 2 }}>Pricing Tier</Box>
          <Box sx={{ flex: 1, textAlign: "center" }}>Price Book</Box>
          <Box sx={{ flex: 1, textAlign: "center" }}>1 Day</Box>
          <Box sx={{ flex: 1, textAlign: "center" }}>1 week</Box>
          <Box sx={{ flex: 1, textAlign: "center" }}>4 weeks</Box>
        </Box>
        <Stack spacing={1}>
          <>
            {rentalPrices.map((price) => {
              const isSelected = selectedPrice === price.id;
              return (
                <Paper
                  key={price.id}
                  variant="outlined"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 2,
                    borderColor: isSelected ? "primary.main" : "grey.300",
                    boxShadow: isSelected ? 2 : 0,
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedPrice(price.id)}
                >
                  <Box sx={{ flex: 2 }}>
                    <input
                      type="radio"
                      checked={isSelected}
                      onChange={() => setSelectedPrice(price.id)}
                      style={{ marginRight: 8 }}
                    />
                    {price.name}
                  </Box>
                  <Box sx={{ flex: 1, textAlign: "center" }}>
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
                  </Box>
                  {price.id === "custom" && isSelected ? (
                    <>
                      <Box sx={{ flex: 1, textAlign: "center" }}>
                        <CustomPriceInput
                          value={customDay}
                          onChange={setCustomDay}
                          placeholder="0.00"
                        />
                      </Box>
                      <Box sx={{ flex: 1, textAlign: "center" }}>
                        <CustomPriceInput
                          value={customWeek}
                          onChange={setCustomWeek}
                          placeholder="0.00"
                        />
                      </Box>
                      <Box sx={{ flex: 1, textAlign: "center" }}>
                        <CustomPriceInput
                          value={customMonth}
                          onChange={setCustomMonth}
                          placeholder="0.00"
                        />
                      </Box>
                    </>
                  ) : (
                    <>
                      <Box sx={{ flex: 1, textAlign: "center" }}>
                        {price.pricePerDayInCents != null
                          ? `$${formatCentsToUSD(price.pricePerDayInCents)}`
                          : "-"}
                      </Box>
                      <Box sx={{ flex: 1, textAlign: "center" }}>
                        {price.pricePerWeekInCents != null
                          ? `$${formatCentsToUSD(price.pricePerWeekInCents)}`
                          : "-"}
                      </Box>
                      <Box sx={{ flex: 1, textAlign: "center" }}>
                        {price.pricePerMonthInCents != null
                          ? `$${formatCentsToUSD(price.pricePerMonthInCents)}`
                          : "-"}
                      </Box>
                    </>
                  )}
                </Paper>
              );
            })}
          </>
        </Stack>
      </DialogContent>
      <Footer
        loading={loading || mutationLoading}
        nextEnabled={!!selectedPrice}
        onNextClick={async () => {
          if (selectedPrice === "custom") {
            await updateLineItem({
              variables: {
                input: {
                  id: lineItemId,
                  price_per_day_in_cents: Math.round(Number(customDay) * 100),
                  price_per_month_in_cents: Math.round(Number(customMonth) * 100),
                  price_per_week_in_cents: Math.round(Number(customWeek) * 100),
                  price_id: "",
                },
              },
            });
          } else {
            await updateLineItem({
              variables: {
                input: {
                  id: lineItemId,
                  price_id: selectedPrice,
                  price_per_day_in_cents: null,
                  price_per_month_in_cents: null,
                  price_per_week_in_cents: null,
                },
              },
            });
          }

          await refetch();
        }}
      />
    </>
  );
};

export default CreateRentalLineItemPricingSelectionStep;
