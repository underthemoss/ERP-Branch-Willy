"use client";

import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import {
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
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { ContactInfo, FormData, LineItem, NewLineItem } from "../page";
import AddLineItemDialog from "./AddLineItemDialog/AddLineItemDialog";
import IntakeFormHeader from "./IntakeFormHeader";

// LocalStorage key for contact info
const CONTACT_STORAGE_KEY = "intakeFormContactInfo";

interface RequestFormProps {
  projectId: string;
  projectName?: string;
  projectCode?: string;
  companyName: string;
  workspaceLogo?: string | null;
  formData: FormData;
  onSubmit: (
    contact: ContactInfo,
    lineItems: LineItem[],
    newLineItems?: NewLineItem[],
  ) => Promise<void>;
  onBack: () => void;
  workspaceId: string;
  pricebookId?: string | null;
  pricebookName?: string | null;
  isSubmitting?: boolean;
}

export default function RequestForm({
  projectId,
  projectName,
  projectCode,
  companyName,
  workspaceLogo,
  formData,
  onSubmit,
  onBack,
  workspaceId,
  pricebookId,
  pricebookName,
  isSubmitting = false,
}: RequestFormProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [currentSection, setCurrentSection] = useState<"contact" | "lineItems">("contact");
  const [loading, setLoading] = useState(false);

  // Initialize contact from localStorage if available, otherwise use formData
  const [contact, setContact] = useState<ContactInfo>(() => {
    if (typeof window !== "undefined") {
      const savedContact = localStorage.getItem(CONTACT_STORAGE_KEY);
      if (savedContact) {
        try {
          return JSON.parse(savedContact);
        } catch (e) {
          console.error("Failed to parse saved contact info:", e);
        }
      }
    }
    return formData.contact;
  });

  const [newLineItems, setNewLineItems] = useState<NewLineItem[]>(formData.newLineItems || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Line item dialog state
  const [lineItemDialogOpen, setLineItemDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Save contact info to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(contact));
    }
  }, [contact]);

  const validateContact = () => {
    const newErrors: Record<string, string> = {};

    if (!contact.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    if (!contact.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!contact.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    }
    if (!contact.company.trim()) {
      newErrors.company = "Company name is required";
    }
    if (!contact.purchaseOrderNumber?.trim()) {
      newErrors.purchaseOrderNumber = "Purchase order number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateLineItems = () => {
    if (newLineItems.length === 0) {
      setErrors({ lineItems: "At least one line item is required" });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleContactContinue = async () => {
    if (validateContact()) {
      setLoading(true);
      try {
        // Call onSubmit to create the submission and navigate
        await onSubmit(contact, [], []);
      } catch (error) {
        console.error("Error creating submission:", error);
        setLoading(false);
      }
    }
  };

  const handleAddLineItem = () => {
    setEditingIndex(null);
    setLineItemDialogOpen(true);
  };

  const handleEditLineItem = (index: number) => {
    setEditingIndex(index);
    setLineItemDialogOpen(true);
  };

  const handleDeleteLineItem = (index: number) => {
    const updated = newLineItems.filter((_, i) => i !== index);
    setNewLineItems(updated);
  };

  const handleSaveLineItem = (lineItem: NewLineItem) => {
    if (editingIndex !== null) {
      // Update existing
      const updated = [...newLineItems];
      updated[editingIndex] = lineItem;
      setNewLineItems(updated);
    } else {
      // Add new
      setNewLineItems([...newLineItems, lineItem]);
    }
    setLineItemDialogOpen(false);
    setEditingIndex(null);
  };

  const handleSubmit = () => {
    if (validateLineItems()) {
      // Pass empty array for old lineItems and new array for newLineItems
      onSubmit(contact, [], newLineItems);
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
      {/* Header Section */}
      <IntakeFormHeader companyName={companyName} workspaceLogo={workspaceLogo} />

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
            <Box>
              <Typography variant="h5" fontWeight="600" color="text.primary" gutterBottom>
                Your Contact Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                We&apos;ll use these details to confirm your order.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ p: isMobile ? 2 : 4 }}>
            {currentSection === "contact" ? (
              <>
                {/* Contact Information Section */}
                <Box mt={2}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={contact.fullName}
                        onChange={(e) => setContact({ ...contact, fullName: e.target.value })}
                        error={!!errors.fullName}
                        helperText={errors.fullName}
                        placeholder="John Smith"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={contact.email}
                        onChange={(e) => setContact({ ...contact, email: e.target.value })}
                        error={!!errors.email}
                        helperText={errors.email}
                        placeholder="john.smith@gmail.com"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={contact.phoneNumber}
                        onChange={(e) => setContact({ ...contact, phoneNumber: e.target.value })}
                        error={!!errors.phoneNumber}
                        helperText={errors.phoneNumber}
                        placeholder="444 - 444 - 4444"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Company"
                        value={contact.company}
                        onChange={(e) => setContact({ ...contact, company: e.target.value })}
                        error={!!errors.company}
                        helperText={errors.company}
                        placeholder="Company Name"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Purchase Order Number"
                        value={contact.purchaseOrderNumber || ""}
                        onChange={(e) =>
                          setContact({ ...contact, purchaseOrderNumber: e.target.value })
                        }
                        error={!!errors.purchaseOrderNumber}
                        helperText={errors.purchaseOrderNumber}
                        placeholder="PO-12345"
                        required
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleContactContinue}
                      disabled={loading || isSubmitting}
                    >
                      {loading || isSubmitting ? "Creating..." : "Continue"}
                    </Button>
                  </Box>
                </Box>
              </>
            ) : (
              <>
                {/* Line Items Section */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Request Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {pricebookId
                      ? "Select items from the price book or add custom products."
                      : "Add items to your request."}
                  </Typography>

                  {errors.lineItems && (
                    <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                      {errors.lineItems}
                    </Typography>
                  )}

                  <Box sx={{ mb: 2 }}>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddLineItem}>
                      Add Line Item
                    </Button>
                  </Box>

                  {newLineItems.length > 0 && (
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Description</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Qty</TableCell>
                            <TableCell>Start Date</TableCell>
                            <TableCell>End Date</TableCell>
                            <TableCell>Cost</TableCell>
                            <TableCell>Delivery</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {newLineItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2">
                                    {getLineItemDescription(item)}
                                  </Typography>
                                  {item.isCustomProduct && (
                                    <Chip
                                      label="Custom"
                                      size="small"
                                      color="info"
                                      sx={{ mt: 0.5 }}
                                    />
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
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditLineItem(index)}
                                  title="Edit"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteLineItem(index)}
                                  title="Delete"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => setCurrentSection("contact")}
                    >
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleSubmit}
                      disabled={newLineItems.length === 0}
                    >
                      Submit Request
                    </Button>
                  </Box>
                </Box>
              </>
            )}
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
        editingItem={editingIndex !== null ? newLineItems[editingIndex] : undefined}
        editingIndex={editingIndex}
        pricebookId={pricebookId}
        workspaceId={workspaceId}
      />
    </>
  );
}
