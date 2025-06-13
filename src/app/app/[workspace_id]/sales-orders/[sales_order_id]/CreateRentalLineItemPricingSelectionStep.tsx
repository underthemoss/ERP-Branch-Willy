"use client";

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
import React, { useState } from "react";

export interface PricingSelectionStepProps {
  soPimId: string;
  pricesLoading: boolean;
  rentalPrices: any[];
  selectedPrice: number | null;
  setSelectedPrice: (idx: number) => void;
  workspace_id: string;
  onCancel: () => void;
  onContinue: () => void;
  onBack: () => void;
  customPrices: { pricePerDay: string; pricePerWeek: string; pricePerMonth: string };
  setCustomPrices: (prices: {
    pricePerDay: string;
    pricePerWeek: string;
    pricePerMonth: string;
  }) => void;
}

const CreateRentalLineItemPricingSelectionStep: React.FC<PricingSelectionStepProps> = ({
  soPimId,
  pricesLoading,
  rentalPrices,
  selectedPrice,
  setSelectedPrice,
  workspace_id,
  onCancel,
  onContinue,
  onBack,
  customPrices,
  setCustomPrices,
}) => {
  // Update custom prices when a regular pricing option is selected
  const handlePriceSelection = (idx: number) => {
    setSelectedPrice(idx);
    if (idx < rentalPrices.length) {
      const selectedRegularPrice = rentalPrices[idx];
      setCustomPrices({
        pricePerDay:
          selectedRegularPrice.pricePerDayInCents != null
            ? (selectedRegularPrice.pricePerDayInCents / 100).toFixed(2)
            : "",
        pricePerWeek:
          selectedRegularPrice.pricePerWeekInCents != null
            ? (selectedRegularPrice.pricePerWeekInCents / 100).toFixed(2)
            : "",
        pricePerMonth:
          selectedRegularPrice.pricePerMonthInCents != null
            ? (selectedRegularPrice.pricePerMonthInCents / 100).toFixed(2)
            : "",
      });
    }
  };

  const handleCustomPriceChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      // Only allow numbers and decimal points
      if (/^\d*\.?\d*$/.test(value)) {
        setCustomPrices({
          ...customPrices,
          [field]: value,
        });
      }
    };

  const customPriceOption = {
    id: "custom",
    name: "Custom Price",
    pricePerDayInCents: customPrices.pricePerDay
      ? Math.round(parseFloat(customPrices.pricePerDay) * 100)
      : null,
    pricePerWeekInCents: customPrices.pricePerWeek
      ? Math.round(parseFloat(customPrices.pricePerWeek) * 100)
      : null,
    pricePerMonthInCents: customPrices.pricePerMonth
      ? Math.round(parseFloat(customPrices.pricePerMonth) * 100)
      : null,
  };

  const allPrices = [...rentalPrices, customPriceOption];

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
          {soPimId ? (
            pricesLoading ? (
              <Typography>Loading prices...</Typography>
            ) : allPrices.length === 0 ? (
              <Typography>No prices found for this product.</Typography>
            ) : (
              <>
                {rentalPrices.map((price, idx: number) => (
                  <Paper
                    key={price.id}
                    variant="outlined"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      p: 2,
                      borderColor: selectedPrice === idx ? "primary.main" : "grey.300",
                      boxShadow: selectedPrice === idx ? 2 : 0,
                      cursor: "pointer",
                    }}
                    onClick={() => handlePriceSelection(idx)}
                  >
                    <Box sx={{ flex: 2 }}>
                      <input
                        type="radio"
                        checked={selectedPrice === idx}
                        onChange={() => handlePriceSelection(idx)}
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
                    <Box sx={{ flex: 1, textAlign: "center" }}>
                      {price.pricePerDayInCents != null
                        ? `$${(price.pricePerDayInCents / 100).toFixed(2)}`
                        : "-"}
                    </Box>
                    <Box sx={{ flex: 1, textAlign: "center" }}>
                      {price.pricePerWeekInCents != null
                        ? `$${(price.pricePerWeekInCents / 100).toFixed(2)}`
                        : "-"}
                    </Box>
                    <Box sx={{ flex: 1, textAlign: "center" }}>
                      {price.pricePerMonthInCents != null
                        ? `$${(price.pricePerMonthInCents / 100).toFixed(2)}`
                        : "-"}
                    </Box>
                  </Paper>
                ))}
                {rentalPrices.length > 0 && (
                  <Divider sx={{ my: 2 }}>
                    {/* <Typography variant="body2" color="text.secondary">
                      Custom Pricing
                    </Typography> */}
                  </Divider>
                )}
                <Paper
                  key={customPriceOption.id}
                  variant="outlined"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 2,
                    borderColor:
                      selectedPrice === rentalPrices.length ? "primary.main" : "grey.300",
                    boxShadow: selectedPrice === rentalPrices.length ? 2 : 0,
                    cursor: "pointer",
                    opacity: selectedPrice !== rentalPrices.length ? 0.7 : 1,
                  }}
                  onClick={() => setSelectedPrice(rentalPrices.length)}
                >
                  <Box sx={{ flex: 2 }}>
                    <input
                      type="radio"
                      checked={selectedPrice === rentalPrices.length}
                      onChange={() => setSelectedPrice(rentalPrices.length)}
                      style={{ marginRight: 8 }}
                    />
                    {customPriceOption.name}
                  </Box>
                  <Box sx={{ flex: 1, textAlign: "center" }}>-</Box>
                  <Box sx={{ flex: 1, textAlign: "center" }}>
                    <FormControl size="small" sx={{ width: "100px" }}>
                      <OutlinedInput
                        value={customPrices.pricePerDay}
                        onChange={handleCustomPriceChange("pricePerDay")}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="0.00"
                        disabled={selectedPrice !== rentalPrices.length}
                        startAdornment={<InputAdornment position="start">$</InputAdornment>}
                        size="small"
                      />
                    </FormControl>
                  </Box>
                  <Box sx={{ flex: 1, textAlign: "center" }}>
                    <FormControl size="small" sx={{ width: "100px" }}>
                      <OutlinedInput
                        value={customPrices.pricePerWeek}
                        onChange={handleCustomPriceChange("pricePerWeek")}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="0.00"
                        disabled={selectedPrice !== rentalPrices.length}
                        startAdornment={<InputAdornment position="start">$</InputAdornment>}
                        size="small"
                      />
                    </FormControl>
                  </Box>
                  <Box sx={{ flex: 1, textAlign: "center" }}>
                    <FormControl size="small" sx={{ width: "100px" }}>
                      <OutlinedInput
                        value={customPrices.pricePerMonth}
                        onChange={handleCustomPriceChange("pricePerMonth")}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="0.00"
                        disabled={selectedPrice !== rentalPrices.length}
                        startAdornment={<InputAdornment position="start">$</InputAdornment>}
                        size="small"
                      />
                    </FormControl>
                  </Box>
                </Paper>
              </>
            )
          ) : (
            <Typography>Select a product to see pricing.</Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          bgcolor: "grey.100",
          borderTop: 1,
          borderColor: "divider",
          px: 3,
          py: 1.5,
          display: "flex",
          justifyContent: "space-between",
          mt: 3,
        }}
      >
        <Button onClick={onCancel} color="inherit">
          Cancel
        </Button>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onBack} color="inherit">
            Back
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={onContinue}
            disabled={selectedPrice === null}
          >
            Continue
          </Button>
        </Box>
      </DialogActions>
    </>
  );
};

export default CreateRentalLineItemPricingSelectionStep;
