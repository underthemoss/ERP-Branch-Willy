"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React from "react";
import { LineItem } from "../page";

interface LineItemsTableProps {
  lineItems: LineItem[];
  showActions?: boolean;
  onEdit?: (index: number) => void;
  onDelete?: (index: number) => void;
  isProcessing?: boolean;
}

export default function LineItemsTable({
  lineItems,
  showActions = false,
  onEdit,
  onDelete,
  isProcessing = false,
}: LineItemsTableProps) {
  const getLineItemDescription = (item: LineItem) => {
    return item.label || "Product";
  };

  const getRentalCostDisplay = (item: LineItem) => {
    if (item.type !== "RENTAL") return "-";

    // If it's a custom product, no pricing available
    if (item.isCustomProduct) return "Custom pricing";

    // Build the rate display
    const rates: string[] = [];
    if (item.pricePerDayInCents) {
      rates.push(`$${(item.pricePerDayInCents / 100).toFixed(2)}/day`);
    }
    if (item.pricePerWeekInCents) {
      rates.push(`$${(item.pricePerWeekInCents / 100).toFixed(2)}/week`);
    }
    if (item.pricePerMonthInCents) {
      rates.push(`$${(item.pricePerMonthInCents / 100).toFixed(2)}/month`);
    }

    // Calculate estimated total if we have duration and a daily rate
    let estimateText = "";
    if (item.rentalDuration && item.pricePerDayInCents) {
      const estimatedTotal = (item.pricePerDayInCents * item.rentalDuration * item.quantity) / 100;
      estimateText = `Est. total: $${estimatedTotal.toFixed(2)}`;
    }

    if (rates.length === 0) return "No pricing";

    return (
      <>
        <Typography variant="caption" display="block">
          {rates.join(", ")}
        </Typography>
        {estimateText && (
          <Typography variant="caption" display="block" color="primary">
            {estimateText}
          </Typography>
        )}
      </>
    );
  };

  const getPurchaseCostDisplay = (item: LineItem) => {
    if (item.type !== "PURCHASE") return "-";

    // If it's a custom product, no pricing available
    if (item.isCustomProduct) return "Custom pricing";

    // Show unit cost if available
    if (item.unitCostInCents) {
      const totalCost = (item.unitCostInCents * item.quantity) / 100;
      return (
        <>
          <Typography variant="caption" display="block">
            ${(item.unitCostInCents / 100).toFixed(2)}/unit
          </Typography>
          <Typography variant="caption" display="block" color="primary">
            Total: ${totalCost.toFixed(2)}
          </Typography>
        </>
      );
    }

    return "No pricing";
  };

  if (lineItems.length === 0) {
    return null;
  }

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        boxShadow: 1,
        "& .MuiTable-root": {
          minWidth: 650,
        },
      }}
    >
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: "grey.50" }}>
            <TableCell sx={{ fontWeight: 500 }}>Description</TableCell>
            <TableCell sx={{ fontWeight: 500 }}>Type</TableCell>
            <TableCell sx={{ fontWeight: 500 }}>Qty</TableCell>
            <TableCell sx={{ fontWeight: 500 }}>Start Date</TableCell>
            <TableCell sx={{ fontWeight: 500 }}>End Date</TableCell>
            <TableCell sx={{ fontWeight: 500 }}>Cost</TableCell>
            <TableCell sx={{ fontWeight: 500 }}>Delivery</TableCell>
            {showActions && <TableCell sx={{ fontWeight: 500 }}>Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {lineItems.map((item, index) => (
            <TableRow
              key={item.id || index}
              sx={{
                "&:hover": {
                  bgcolor: showActions ? "action.hover" : undefined,
                },
                "&:last-child td, &:last-child th": {
                  border: 0,
                },
              }}
            >
              <TableCell>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {getLineItemDescription(item)}
                  </Typography>
                  {item.isCustomProduct && (
                    <Chip label="Custom" size="small" color="info" sx={{ mt: 0.5 }} />
                  )}
                </Box>
              </TableCell>
              <TableCell>{item.type}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>
                {item.type === "RENTAL" && item.rentalStartDate
                  ? new Date(item.rentalStartDate).toLocaleDateString()
                  : item.type === "PURCHASE" && item.deliveryDate
                    ? new Date(item.deliveryDate).toLocaleDateString()
                    : "-"}
              </TableCell>
              <TableCell>
                {item.type === "RENTAL" && item.rentalEndDate
                  ? new Date(item.rentalEndDate).toLocaleDateString()
                  : "-"}
              </TableCell>
              <TableCell>
                {item.type === "PURCHASE"
                  ? getPurchaseCostDisplay(item)
                  : getRentalCostDisplay(item)}
              </TableCell>
              <TableCell>
                <Typography variant="caption" color="text.secondary">
                  {item.deliveryMethod || "-"}
                </Typography>
              </TableCell>
              {showActions && (
                <TableCell>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => onEdit?.(index)}
                      disabled={isProcessing}
                      title="Edit"
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onDelete?.(index)}
                      disabled={isProcessing}
                      title="Delete"
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
