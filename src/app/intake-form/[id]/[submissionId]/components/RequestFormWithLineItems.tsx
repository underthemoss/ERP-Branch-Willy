"use client";

import { Add as AddIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useState } from "react";
import AddLineItemDialog from "../../components/AddLineItemDialog/AddLineItemDialog";
import LineItemsTable from "../../components/LineItemsTable";
import { LineItem } from "../page";

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
  lineItems: LineItem[];
  onAddLineItem: (lineItem: LineItem) => Promise<void>;
  onUpdateLineItem: (lineItemId: string, lineItem: LineItem) => Promise<void>;
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

  const handleSaveLineItem = async (lineItem: LineItem) => {
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

              <LineItemsTable
                lineItems={lineItems}
                showActions={true}
                onEdit={handleEditLineItem}
                onDelete={handleDeleteLineItem}
                isProcessing={isProcessing}
              />

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
