"use client";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";

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
}) => (
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
          ) : rentalPrices.length === 0 ? (
            <Typography>No prices found for this product.</Typography>
          ) : (
            rentalPrices.map((price, idx: number) => (
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
                onClick={() => setSelectedPrice(idx)}
              >
                <Box sx={{ flex: 2 }}>
                  <input
                    type="radio"
                    checked={selectedPrice === idx}
                    onChange={() => setSelectedPrice(idx)}
                    style={{ marginRight: 8 }}
                  />
                  {price.name || "Rental Price"}
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
            ))
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

export default CreateRentalLineItemPricingSelectionStep;
