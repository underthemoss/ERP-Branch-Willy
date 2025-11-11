"use client";

import { GetQuoteByIdQuery } from "@/graphql/graphql";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import {
  Alert,
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import * as React from "react";

type Quote = NonNullable<GetQuoteByIdQuery["quoteById"]>;
type LineItem = NonNullable<Quote["currentRevision"]>["lineItems"][0];

interface LineItemsSectionProps {
  quote: Quote;
}

function formatPrice(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "$0.00";
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function calculateDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function getItemTypeIcon(type: string) {
  switch (type) {
    case "RENTAL":
      return <LocalShippingOutlinedIcon fontSize="small" />;
    case "SALE":
      return <ShoppingCartOutlinedIcon fontSize="small" />;
    case "SERVICE":
      return <BuildOutlinedIcon fontSize="small" />;
    default:
      return null;
  }
}

function getItemTypeColor(type: string): "primary" | "success" | "secondary" {
  switch (type) {
    case "RENTAL":
      return "primary";
    case "SALE":
      return "success";
    case "SERVICE":
      return "secondary";
    default:
      return "primary";
  }
}

export function LineItemsSection({ quote }: LineItemsSectionProps) {
  const lineItems = quote.currentRevision?.lineItems || [];

  const totalAmount = React.useMemo(() => {
    return lineItems.reduce((sum, item) => {
      return sum + (item.subtotalInCents || 0);
    }, 0);
  }, [lineItems]);

  if (!lineItems || lineItems.length === 0) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Line Items
        </Typography>
        <Alert severity="info">No line items</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Line Items ({lineItems.length})
      </Typography>

      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">
              Qty
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">
              Price
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">
              Subtotal
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lineItems.map((item: LineItem, index: number) => {
            let priceDisplay = "—";
            let categoryName = "";
            let dateRange = "";
            let duration = 0;
            let priceBreakdown: React.ReactNode = null;

            // Handle Rental Line Items
            if (item.__typename === "QuoteRevisionRentalLineItem") {
              if (item.price?.__typename === "RentalPrice") {
                const dailyRate = item.price.pricePerDayInCents;
                const weeklyRate = item.price.pricePerWeekInCents;
                const monthlyRate = item.price.pricePerMonthInCents;

                priceDisplay = formatPrice(dailyRate) + "/day";

                // Calculate duration
                duration = calculateDuration(item.rentalStartDate, item.rentalEndDate);

                // Create price breakdown table
                priceBreakdown = (
                  <Box
                    sx={{
                      mt: 1,
                      p: 1.5,
                      backgroundColor: "primary.50",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "primary.200",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
                    >
                      Rental Rates:
                    </Typography>
                    <Stack spacing={0.25}>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="caption">Daily:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          {formatPrice(dailyRate)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="caption">Weekly:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          {formatPrice(weeklyRate)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="caption">Monthly:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          {formatPrice(monthlyRate)}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mt: 0.5,
                          pt: 0.5,
                          borderTop: "1px solid",
                          borderColor: "primary.300",
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          Duration:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {duration} {duration === 1 ? "day" : "days"}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                );
              }
              if (item.pimCategory) {
                categoryName = item.pimCategory.name;
              }
              dateRange = `${formatDate(item.rentalStartDate)} - ${formatDate(item.rentalEndDate)}`;
            }
            // Handle Sale Line Items
            else if (item.__typename === "QuoteRevisionSaleLineItem") {
              if (item.price?.__typename === "SalePrice") {
                priceDisplay = formatPrice(item.price.unitCostInCents);
              }
              if (item.pimCategory) {
                categoryName = item.pimCategory.name;
              }
            }
            // Handle Service Line Items
            else if (item.__typename === "QuoteRevisionServiceLineItem") {
              if (item.price) {
                priceDisplay = "Service";
              }
            }

            return (
              <TableRow
                key={item.id || index}
                sx={{
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                <TableCell>
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <Box sx={{ color: `${getItemTypeColor(item.type)}.main` }}>
                        {getItemTypeIcon(item.type)}
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.description}
                      </Typography>
                    </Box>
                    {categoryName && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", ml: 4 }}
                      >
                        Category: {categoryName}
                      </Typography>
                    )}
                    {dateRange && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", ml: 4 }}
                      >
                        {dateRange}
                      </Typography>
                    )}
                    {priceBreakdown}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={item.type}
                    size="small"
                    color={getItemTypeColor(item.type)}
                    sx={{ fontWeight: 500 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">{item.quantity}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">{priceDisplay}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatPrice(item.subtotalInCents)}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}

          {/* Total Row */}
          <TableRow>
            <TableCell colSpan={4} align="right" sx={{ fontWeight: 600, fontSize: "1rem" }}>
              Total:
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
              {formatPrice(totalAmount)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Paper>
  );
}
