"use client";

import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useState } from "react";
import AddLineItemDialog from "../../components/AddLineItemDialog/AddLineItemDialog";
import { NewLineItem } from "../page";

interface RequestFormWithLineItemsProps {
  projectId: string;
  projectName?: string;
  projectCode?: string;
  companyName: string;
  workspaceId: string;
  workspaceLogo?: string | null;
  workspaceBanner?: string | null;
  pricebookId?: string | null;
  pricebookName?: string | null;
  submissionId: string;
  submissionStatus?: "DRAFT" | "SUBMITTED";
  lineItems: NewLineItem[];
  onAddLineItem: (lineItem: NewLineItem) => Promise<void>;
  onUpdateLineItem: (lineItemId: string, lineItem: NewLineItem) => Promise<void>;
  onDeleteLineItem: (lineItemId: string) => Promise<void>;
  onContinue: () => void;
  onBack: () => void;
}

export default function RequestFormWithLineItems({
  projectId,
  projectName,
  projectCode,
  companyName,
  workspaceId,
  workspaceLogo,
  workspaceBanner,
  pricebookId,
  pricebookName,
  submissionId,
  submissionStatus = "DRAFT",
  lineItems,
  onAddLineItem,
  onUpdateLineItem,
  onDeleteLineItem,
  onContinue,
  onBack,
}: RequestFormWithLineItemsProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Line item dialog state
  const [lineItemDialogOpen, setLineItemDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const validateLineItems = () => {
    if (lineItems.length === 0) {
      setErrors({ lineItems: "At least one line item is required" });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleAddLineItem = () => {
    setEditingIndex(null);
    setLineItemDialogOpen(true);
  };

  const handleEditLineItem = (index: number) => {
    setEditingIndex(index);
    setLineItemDialogOpen(true);
  };

  const handleDeleteLineItem = async (index: number) => {
    const item = lineItems[index];
    if (item.id) {
      setIsProcessing(true);
      try {
        await onDeleteLineItem(item.id);
      } catch (error) {
        console.error("Error deleting line item:", error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleSaveLineItem = async (lineItem: NewLineItem) => {
    setIsProcessing(true);
    try {
      if (editingIndex !== null && lineItems[editingIndex]?.id) {
        // Update existing
        await onUpdateLineItem(lineItems[editingIndex].id!, lineItem);
      } else {
        // Add new
        await onAddLineItem(lineItem);
      }
      setLineItemDialogOpen(false);
      setEditingIndex(null);
    } catch (error) {
      console.error("Error saving line item:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = () => {
    if (validateLineItems()) {
      onContinue();
    }
  };

  const formatPrice = (cents?: number) => {
    if (!cents) return "-";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getLineItemDescription = (item: NewLineItem) => {
    if (item.isCustomProduct) {
      return item.customProductName || "Custom Product";
    }
    return item.priceName || item.pimCategoryName || "Product";
  };

  const getRentalCostDisplay = (item: NewLineItem) => {
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

  const getPurchaseCostDisplay = (item: NewLineItem) => {
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

  return (
    <>
      <Container maxWidth="md" sx={{ py: isMobile ? 2 : 4 }}>
        <Paper elevation={3} sx={{ overflow: "hidden" }}>
          {/* Project Header */}
          <Box
            sx={{
              bgcolor: "grey.50",
              p: isMobile ? 2 : 3,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="h5" fontWeight="600" color="text.primary" gutterBottom>
                  Request Details
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Typography variant="body1" color="text.secondary">
                    Project:
                  </Typography>
                  <Typography variant="body1" fontWeight="500">
                    {projectName || "Unnamed Project"}
                  </Typography>
                  {projectCode && (
                    <Chip
                      label={`Code: ${projectCode}`}
                      size="small"
                      variant="outlined"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              </Box>
              <Chip
                label={submissionStatus === "SUBMITTED" ? "Submitted" : "Draft"}
                color={submissionStatus === "SUBMITTED" ? "success" : "default"}
                size="medium"
                sx={{
                  fontWeight: 600,
                  px: 2,
                  height: 32,
                }}
              />
            </Box>
          </Box>

          <Box sx={{ p: isMobile ? 2 : 4 }}>
            {/* Line Items Section */}
            <Box>
              {errors.lineItems && (
                <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                  {errors.lineItems}
                </Typography>
              )}

              <Box sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddLineItem}
                  disabled={isProcessing}
                  size="large"
                >
                  Add Item
                </Button>
              </Box>

              {lineItems.length > 0 && (
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
                        <TableCell sx={{ fontWeight: 500 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lineItems.map((item, index) => (
                        <TableRow
                          key={item.id || index}
                          sx={{
                            "&:hover": {
                              bgcolor: "action.hover",
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
                          <TableCell>
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleEditLineItem(index)}
                                disabled={isProcessing}
                                title="Edit"
                                color="primary"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteLineItem(index)}
                                disabled={isProcessing}
                                title="Delete"
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {lineItems.length === 0 && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 4,
                    textAlign: "center",
                    bgcolor: "grey.50",
                    borderStyle: "dashed",
                    borderWidth: 2,
                  }}
                >
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Items Added Yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click the &ldquo;Add Item&rdquo; button above to start building your request.
                  </Typography>
                </Paper>
              )}

              <Box
                sx={{
                  mt: 4,
                  pt: 3,
                  borderTop: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Button variant="outlined" size="large" onClick={onBack} disabled={isProcessing}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleContinue}
                  disabled={lineItems.length === 0 || isProcessing}
                >
                  Submit
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>

      {/* Line Item Dialog */}
      <AddLineItemDialog
        open={lineItemDialogOpen}
        onClose={() => {
          setLineItemDialogOpen(false);
          setEditingIndex(null);
        }}
        onSave={handleSaveLineItem}
        editingItem={editingIndex !== null ? lineItems[editingIndex] : undefined}
        editingIndex={editingIndex}
        pricebookId={pricebookId}
        workspaceId={workspaceId}
        loading={isProcessing}
        lastLineItem={lineItems.length > 0 ? lineItems[lineItems.length - 1] : undefined}
      />
    </>
  );
}
