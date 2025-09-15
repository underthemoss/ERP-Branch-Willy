"use client";

import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
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
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import React, { useState } from "react";
import { ContactInfo, FormData, LineItem } from "../page";

interface RequestFormProps {
  projectId: string;
  projectName?: string;
  companyName: string;
  formData: FormData;
  onSubmit: (contact: ContactInfo, lineItems: LineItem[]) => void;
  onBack: () => void;
}

export default function RequestForm({
  projectId,
  projectName,
  companyName,
  formData,
  onSubmit,
  onBack,
}: RequestFormProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [currentSection, setCurrentSection] = useState<"contact" | "lineItems">("contact");

  const [contact, setContact] = useState<ContactInfo>(formData.contact);
  const [lineItems, setLineItems] = useState<LineItem[]>(formData.lineItems);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Line item dialog state
  const [lineItemDialogOpen, setLineItemDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentLineItem, setCurrentLineItem] = useState<LineItem>({
    description: "",
    startDate: new Date(),
    type: "RENTAL",
    durationInDays: 7,
    quantity: 1,
  });
  const [lineItemErrors, setLineItemErrors] = useState<Record<string, string>>({});

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateLineItems = () => {
    if (lineItems.length === 0) {
      setErrors({ lineItems: "At least one line item is required" });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateLineItem = () => {
    const newErrors: Record<string, string> = {};

    if (!currentLineItem.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (currentLineItem.quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }
    if (currentLineItem.type === "RENTAL" && currentLineItem.durationInDays <= 0) {
      newErrors.durationInDays = "Duration must be greater than 0";
    }

    setLineItemErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContactContinue = () => {
    if (validateContact()) {
      setCurrentSection("lineItems");
      setErrors({});
    }
  };

  const handleAddLineItem = () => {
    setEditingIndex(null);
    setCurrentLineItem({
      description: "",
      startDate: new Date(),
      type: "RENTAL",
      durationInDays: 7,
      quantity: 1,
    });
    setLineItemErrors({});
    setLineItemDialogOpen(true);
  };

  const handleEditLineItem = (index: number) => {
    setEditingIndex(index);
    setCurrentLineItem({ ...lineItems[index] });
    setLineItemErrors({});
    setLineItemDialogOpen(true);
  };

  const handleDeleteLineItem = (index: number) => {
    const newLineItems = lineItems.filter((_, i) => i !== index);
    setLineItems(newLineItems);
  };

  const handleSaveLineItem = () => {
    if (validateLineItem()) {
      if (editingIndex !== null) {
        const newLineItems = [...lineItems];
        newLineItems[editingIndex] = currentLineItem;
        setLineItems(newLineItems);
      } else {
        setLineItems([...lineItems, currentLineItem]);
      }
      setLineItemDialogOpen(false);
    }
  };

  const handleSubmit = () => {
    if (validateLineItems()) {
      onSubmit(contact, lineItems);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md" sx={{ py: isMobile ? 2 : 4 }}>
        <Paper elevation={1} sx={{ p: isMobile ? 2 : 4 }}>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ mb: 1 }}>
              Request Portal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Project {projectName || projectId || "N/A"}
            </Typography>
          </Box>

          {currentSection === "contact" ? (
            <>
              {/* Contact Information Section */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Contact Information
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  We&apos;ll use these details to confirm your order.
                </Typography>

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
                      label="Purchase Order Number (Optional)"
                      value={contact.purchaseOrderNumber || ""}
                      onChange={(e) =>
                        setContact({ ...contact, purchaseOrderNumber: e.target.value })
                      }
                      placeholder="PO-12345"
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleContactContinue}
                    sx={{
                      bgcolor: "#4A90E2",
                      "&:hover": {
                        bgcolor: "#357ABD",
                      },
                    }}
                  >
                    Continue
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
                  Add equipment items to your request.
                </Typography>

                {errors.lineItems && (
                  <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                    {errors.lineItems}
                  </Typography>
                )}

                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddLineItem}
                    sx={{
                      bgcolor: "#4A90E2",
                      "&:hover": {
                        bgcolor: "#357ABD",
                      },
                    }}
                  >
                    Add Line Item
                  </Button>
                </Box>

                {lineItems.length > 0 && (
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Description</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Start Date</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Duration</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {lineItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.type}</TableCell>
                            <TableCell>{new Date(item.startDate).toLocaleDateString()}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                              {item.type === "RENTAL" ? `${item.durationInDays} days` : "-"}
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
                    disabled={lineItems.length === 0}
                    sx={{
                      bgcolor: "#4A90E2",
                      "&:hover": {
                        bgcolor: "#357ABD",
                      },
                      textTransform: "uppercase",
                    }}
                  >
                    Submit Request
                  </Button>
                </Box>
              </Box>
            </>
          )}

          {/* Footer */}
          <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid #e0e0e0" }}>
            <Typography variant="caption" color="text.secondary">
              This portal is managed by <strong>{companyName}</strong>.
            </Typography>
          </Box>
        </Paper>
      </Container>

      {/* Line Item Dialog */}
      <Dialog
        open={lineItemDialogOpen}
        onClose={() => setLineItemDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingIndex !== null ? "Edit Line Item" : "Add Line Item"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={currentLineItem.description}
                onChange={(e) =>
                  setCurrentLineItem({ ...currentLineItem, description: e.target.value })
                }
                error={!!lineItemErrors.description}
                helperText={lineItemErrors.description}
                placeholder="e.g., Forklift with 8,000 lb lift capacity"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                select
                label="Type"
                value={currentLineItem.type}
                onChange={(e) => {
                  const newType = e.target.value as "RENTAL" | "PURCHASE";
                  setCurrentLineItem({
                    ...currentLineItem,
                    type: newType,
                    durationInDays: newType === "PURCHASE" ? 0 : currentLineItem.durationInDays,
                  });
                }}
              >
                <MenuItem value="RENTAL">Rental</MenuItem>
                <MenuItem value="PURCHASE">Purchase</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <DatePicker
                label="Start Date"
                value={currentLineItem.startDate}
                onChange={(newValue) =>
                  setCurrentLineItem({
                    ...currentLineItem,
                    startDate: newValue ? new Date(newValue.toISOString()) : new Date(),
                  })
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={currentLineItem.quantity}
                onChange={(e) => {
                  const quantity = parseInt(e.target.value) || 0;
                  const newItem = { ...currentLineItem, quantity };
                  setCurrentLineItem(newItem);
                }}
                error={!!lineItemErrors.quantity}
                helperText={lineItemErrors.quantity}
                inputProps={{ min: 1 }}
              />
            </Grid>
            {currentLineItem.type === "RENTAL" && (
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label="Duration (days)"
                  type="number"
                  value={currentLineItem.durationInDays}
                  onChange={(e) => {
                    const durationInDays = parseInt(e.target.value) || 0;
                    const newItem = { ...currentLineItem, durationInDays };
                    setCurrentLineItem(newItem);
                  }}
                  error={!!lineItemErrors.durationInDays}
                  helperText={lineItemErrors.durationInDays}
                  inputProps={{ min: 1 }}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLineItemDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveLineItem} variant="contained">
            {editingIndex !== null ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
