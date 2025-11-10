"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import * as React from "react";
import type { PriceHit } from "./BrowseCatalogDialog";

export interface LineItemDetails {
  priceId: string;
  priceName: string;
  priceType: "RENTAL" | "SALE";
  pimCategoryId: string;
  pimCategoryName: string;
  description: string;
  quantity: number;
  // Rental specific
  rentalStartDate?: Date;
  rentalEndDate?: Date;
  pricePerDayInCents?: number;
  pricePerWeekInCents?: number;
  pricePerMonthInCents?: number;
  // Sale specific
  unitCostInCents?: number;
  // Calculated
  subtotalInCents: number;
}

interface LineItemDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  price: PriceHit | null;
  onSubmit: (details: LineItemDetails) => void;
}

// Format price in cents to dollars
function formatPrice(cents: number | null): string {
  if (cents === null || cents === undefined) return "$0.00";
  return `$${(cents / 100).toFixed(2)}`;
}

// Calculate rental subtotal based on date range
function calculateRentalSubtotal(
  startDate: Date | null,
  endDate: Date | null,
  quantity: number,
  pricePerDayInCents: number | null,
  pricePerWeekInCents: number | null,
  pricePerMonthInCents: number | null,
): number {
  if (!startDate || !endDate || !pricePerDayInCents) return 0;

  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 0;

  // Use day rate for now (could be enhanced to use week/month rates based on duration)
  return days * pricePerDayInCents * quantity;
}

// Calculate sale subtotal
function calculateSaleSubtotal(quantity: number, unitCostInCents: number | null): number {
  if (!unitCostInCents) return 0;
  return quantity * unitCostInCents;
}

export function LineItemDetailsDialog({
  open,
  onClose,
  price,
  onSubmit,
}: LineItemDetailsDialogProps) {
  const [quantity, setQuantity] = React.useState<number>(1);
  const [description, setDescription] = React.useState<string>("");
  const [rentalStartDate, setRentalStartDate] = React.useState<Date | null>(null);
  const [rentalEndDate, setRentalEndDate] = React.useState<Date | null>(null);
  const [subtotal, setSubtotal] = React.useState<number>(0);

  // Reset form when price changes
  React.useEffect(() => {
    if (price) {
      setQuantity(1);
      setDescription(price.name || price.pimCategoryName || "");
      setRentalStartDate(null);
      setRentalEndDate(null);
      setSubtotal(0);
    }
  }, [price]);

  // Calculate subtotal whenever inputs change
  React.useEffect(() => {
    if (!price) return;

    if (price.priceType === "RENTAL") {
      const newSubtotal = calculateRentalSubtotal(
        rentalStartDate,
        rentalEndDate,
        quantity,
        price.pricePerDayInCents,
        price.pricePerWeekInCents,
        price.pricePerMonthInCents,
      );
      setSubtotal(newSubtotal);
    } else {
      const newSubtotal = calculateSaleSubtotal(quantity, price.unitCostInCents);
      setSubtotal(newSubtotal);
    }
  }, [price, quantity, rentalStartDate, rentalEndDate]);

  if (!price) return null;

  const isRental = price.priceType === "RENTAL";
  const canSubmit =
    quantity > 0 &&
    description.trim() !== "" &&
    (!isRental || (rentalStartDate && rentalEndDate && rentalStartDate < rentalEndDate));

  const handleSubmit = () => {
    if (!canSubmit) return;

    const details: LineItemDetails = {
      priceId: price._id,
      priceName: price.name || "Unnamed Price",
      priceType: price.priceType,
      pimCategoryId: price.pimCategoryId,
      pimCategoryName: price.pimCategoryName,
      description: description.trim(),
      quantity,
      subtotalInCents: subtotal,
    };

    if (isRental) {
      details.rentalStartDate = rentalStartDate!;
      details.rentalEndDate = rentalEndDate!;
      details.pricePerDayInCents = price.pricePerDayInCents ?? undefined;
      details.pricePerWeekInCents = price.pricePerWeekInCents ?? undefined;
      details.pricePerMonthInCents = price.pricePerMonthInCents ?? undefined;
    } else {
      details.unitCostInCents = price.unitCostInCents ?? undefined;
    }

    onSubmit(details);
    onClose();
  };

  // Get category breadcrumb
  const getCategoryBreadcrumb = (): string => {
    if (!price.pimCategoryPath) return "";
    const cleaned = price.pimCategoryPath.replace(/^\||\|$/g, "");
    const parts = cleaned.split("|").filter((part) => part.trim());
    return parts.join(" › ");
  };

  const categoryBreadcrumb = getCategoryBreadcrumb();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Line Item Details</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Price Info */}
            <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                {price.name || "Unnamed Price"}
              </Typography>
              {categoryBreadcrumb && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {categoryBreadcrumb}
                </Typography>
              )}
              <Box
                sx={{
                  display: "inline-block",
                  px: 1,
                  py: 0.5,
                  bgcolor: isRental ? "info.lighter" : "success.lighter",
                  color: isRental ? "info.dark" : "success.dark",
                  borderRadius: 1,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  mt: 1,
                }}
              >
                {price.priceType}
              </Box>
              {isRental ? (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Day: {formatPrice(price.pricePerDayInCents)} | Week:{" "}
                    {formatPrice(price.pricePerWeekInCents)} | Month:{" "}
                    {formatPrice(price.pricePerMonthInCents)}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Unit Cost: {formatPrice(price.unitCostInCents)}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Form Fields */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Description"
                  fullWidth
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  helperText="Product name or description for the quote"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Quantity"
                  type="number"
                  fullWidth
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  required
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>

              {isRental && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DatePicker
                      label="Rental Start Date"
                      value={rentalStartDate}
                      onChange={(newValue) =>
                        setRentalStartDate(newValue ? new Date(newValue.toString()) : null)
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          error: Boolean(
                            rentalStartDate && rentalEndDate && rentalStartDate >= rentalEndDate,
                          ),
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DatePicker
                      label="Rental End Date"
                      value={rentalEndDate}
                      onChange={(newValue) =>
                        setRentalEndDate(newValue ? new Date(newValue.toString()) : null)
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          error: Boolean(
                            rentalStartDate && rentalEndDate && rentalStartDate >= rentalEndDate,
                          ),
                          helperText:
                            rentalStartDate && rentalEndDate && rentalStartDate >= rentalEndDate
                              ? "End date must be after start date"
                              : undefined,
                        },
                      }}
                    />
                  </Grid>
                </>
              )}

              {/* Subtotal Display */}
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "primary.lighter",
                    borderRadius: 1,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body1" fontWeight={600}>
                    Subtotal:
                  </Typography>
                  <Typography variant="h6" color="primary.main" fontWeight={700}>
                    {formatPrice(subtotal)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!canSubmit}>
            Add to Quote
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
