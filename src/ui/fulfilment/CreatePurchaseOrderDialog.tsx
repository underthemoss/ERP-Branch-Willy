"use client";

import { useNotification } from "@/providers/NotificationProvider";
import { useApolloClient } from "@apollo/client";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Paper,
  Radio,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { differenceInCalendarDays, format } from "date-fns";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import ContactSelector from "../ContactSelector";
import { useListPricesQuery } from "../prices/api";
import ProjectSelector from "../ProjectSelector";
import {
  useGetDefaultTemplatesQuery,
  useListReferenceNumberTemplatesQuery,
} from "../reference-numbers/api";
import {
  InventoryAssignment_RentalFulFulfilment,
  useCreatePurchaseOrderForFulfilmentMutation,
  useCreateRentalPurchaseOrderLineItemForFulfilmentMutation,
  useGeneratePurchaseOrderReferenceNumberMutation,
  useSetFulfilmentPurchaseOrderLineItemIdMutationMutation,
  useSubmitPurchaseOrderForFulfilmentMutation,
} from "./api";

type CreatePurchaseOrderDialogProps = {
  open: boolean;
  onClose: () => void;
  fulfilment: InventoryAssignment_RentalFulFulfilment;
};

type PriceOption = {
  id: string;
  name: string | null;
  priceBookName: string;
  priceBookId: string;
  pimCategoryName: string;
  pricePerDayInCents: number;
  pricePerWeekInCents: number;
  pricePerMonthInCents: number;
};

export function CreatePurchaseOrderDialog({
  open,
  onClose,
  fulfilment,
}: CreatePurchaseOrderDialogProps) {
  const client = useApolloClient();
  const { notifySuccess, notifyError } = useNotification();
  const params = useParams();
  const workspaceId = params?.workspace_id as string;

  const [activeStep, setActiveStep] = useState(0);
  const [vendorId, setVendorId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>(fulfilment.project?.id || "");
  const [poNumber, setPoNumber] = useState<string>("");
  const [selectedPriceId, setSelectedPriceId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterByCategory, setFilterByCategory] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createPO] = useCreatePurchaseOrderForFulfilmentMutation();
  const [createLineItem] = useCreateRentalPurchaseOrderLineItemForFulfilmentMutation();
  const [linkToFulfilment] = useSetFulfilmentPurchaseOrderLineItemIdMutationMutation();
  const [submitPO] = useSubmitPurchaseOrderForFulfilmentMutation();
  const [generateRefNumber] = useGeneratePurchaseOrderReferenceNumberMutation();

  // Fetch default templates for PO number generation
  const { data: defaultTemplatesData } = useGetDefaultTemplatesQuery();

  // Fetch project-specific templates if a project is selected
  const { data: projectTemplatesData } = useListReferenceNumberTemplatesQuery({
    variables: {
      filter: {
        projectId: projectId || undefined,
        type: "PO" as any,
      },
    },
    skip: !projectId,
  });

  // Fetch ALL prices for client-side filtering with DataGrid
  const { data: pricesData, loading: pricesLoading } = useListPricesQuery({
    variables: {
      workspaceId,
      priceType: "RENTAL" as any,
      shouldListPriceBooks: false,
      page: { number: 1, size: 1000 }, // Large page size for client-side filtering
    },
    skip: activeStep < 2, // Keep prices loaded from step 2 onwards (including confirmation step)
  });

  const prices: PriceOption[] =
    pricesData?.listPrices?.items
      .filter((p) => p.__typename === "RentalPrice")
      .map((price: any) => ({
        id: price.id,
        name: price.name,
        priceBookName: price.priceBook?.name || "Default",
        priceBookId: price.priceBook?.id || "",
        pimCategoryName: price.pimCategoryName,
        pricePerDayInCents: price.pricePerDayInCents,
        pricePerWeekInCents: price.pricePerWeekInCents,
        pricePerMonthInCents: price.pricePerMonthInCents,
      })) || [];

  const selectedPrice = prices.find((p) => p.id === selectedPriceId);

  // Calculate rental duration
  const rentalStart = fulfilment.rentalStartDate
    ? new Date(fulfilment.rentalStartDate)
    : new Date();
  const rentalEnd = fulfilment.expectedRentalEndDate
    ? new Date(fulfilment.expectedRentalEndDate)
    : new Date();
  const totalDays = differenceInCalendarDays(rentalEnd, rentalStart);

  // Calculate estimated cost
  const estimatedCost = selectedPrice
    ? Math.floor(
        (selectedPrice.pricePerDayInCents * totalDays) / 100, // Simple daily calculation
      )
    : 0;

  const handleNext = () => {
    if (activeStep === 0 && !vendorId) {
      notifyError("Please select a vendor");
      return;
    }
    if (activeStep === 1 && !poNumber) {
      notifyError("Please provide a PO number");
      return;
    }
    if (activeStep === 2 && !selectedPriceId) {
      notifyError("Please select a price");
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleGeneratePONumber = async () => {
    setIsGenerating(true);
    try {
      // Find the appropriate template based on hierarchy
      let template = null;

      if (projectId && projectTemplatesData?.listReferenceNumberTemplates) {
        // Try project-specific template first
        template = projectTemplatesData.listReferenceNumberTemplates.find(
          (t: any) => t.type === "PO" && t.projectId === projectId && !t.deleted,
        );
      }

      // Fall back to workspace default template
      if (!template && defaultTemplatesData?.getDefaultTemplates) {
        template = defaultTemplatesData.getDefaultTemplates.find(
          (t: any) => t.type === "PO" && !t.projectId && !t.deleted,
        );
      }

      if (!template) {
        notifyError("No PO number template found. Please set one up in workspace settings.");
        return;
      }

      const result = await generateRefNumber({
        variables: {
          input: {
            templateId: template.id,
            projectCode: fulfilment.project?.project_code,
          },
        },
      });

      if (result.data?.generateReferenceNumber?.referenceNumber) {
        setPoNumber(result.data.generateReferenceNumber.referenceNumber);
        notifySuccess("PO number generated");
      }
    } catch (error) {
      notifyError("Failed to generate PO number");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (shouldSubmit: boolean) => {
    setIsSubmitting(true);
    try {
      // Step 1: Create Purchase Order
      const poResult = await createPO({
        variables: {
          input: {
            workspace_id: workspaceId,
            seller_id: vendorId,
            project_id: projectId || undefined,
            purchase_order_number: poNumber,
          },
        },
      });

      const purchaseOrderId = poResult.data?.createPurchaseOrder?.id;
      if (!purchaseOrderId) throw new Error("Failed to create purchase order");

      // Step 2: Create Line Item
      const lineItemResult = await createLineItem({
        variables: {
          input: {
            purchase_order_id: purchaseOrderId,
            price_id: selectedPriceId,
            po_pim_id: fulfilment.pimCategoryId!,
            po_quantity: 1,
            off_rent_date: fulfilment.expectedRentalEndDate || undefined,
            lineitem_status: "CONFIRMED" as any,
            // Get delivery info from sales order line item if available
            delivery_date: undefined, // Would need to fetch from sales order line item
            delivery_location: undefined,
            delivery_method: undefined,
            delivery_charge_in_cents: undefined,
            deliveryNotes: undefined,
          },
        },
      });

      const lineItemId = lineItemResult.data?.createRentalPurchaseOrderLineItem?.id;
      if (!lineItemId) throw new Error("Failed to create line item");

      // Step 3: Link to Fulfilment
      await linkToFulfilment({
        variables: {
          fulfilmentId: fulfilment.id,
          purchaseOrderLineItemId: lineItemId,
        },
      });

      // Step 4: Optionally submit PO
      if (shouldSubmit) {
        await submitPO({
          variables: {
            id: purchaseOrderId,
          },
        });
      }

      // Refetch queries after all operations complete
      await client.refetchQueries({
        include: ["ListRentalFulfilments", "SourcingPanelListInventory"],
        optimistic: false,
      });

      notifySuccess(
        shouldSubmit ? "Purchase order created and submitted" : "Purchase order created as draft",
      );
      onClose();
    } catch (error: any) {
      notifyError(error.message || "Failed to create purchase order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setActiveStep(0);
    setVendorId("");
    setProjectId(fulfilment.project?.id || "");
    setPoNumber("");
    setSelectedPriceId("");
    onClose();
  };

  const steps = ["Vendor & Project", "PO Number", "Select Price", "Confirm"];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Purchase Order</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ my: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Fulfilment Summary */}
        <Box sx={{ mb: 3, p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Fulfilment Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Product: {fulfilment.pimCategoryName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Customer: {fulfilment.contact?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dates: {format(rentalStart, "dd/MM/yyyy")} - {format(rentalEnd, "dd/MM/yyyy")} (
            {totalDays} days)
          </Typography>
        </Box>

        {/* Step 1: Vendor & Project */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Select Vendor
            </Typography>
            <ContactSelector
              contactId={vendorId}
              onChange={setVendorId}
              type="business"
              workspaceId={workspaceId}
            />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, mt: 3 }}>
              Select Project (Optional)
            </Typography>
            <Box>
              <ProjectSelector projectId={projectId} onChange={setProjectId} />
            </Box>
          </Box>
        )}

        {/* Step 2: PO Number */}
        {activeStep === 1 && (
          <Box>
            <TextField
              fullWidth
              label="Purchase Order Number"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              helperText="Enter manually or generate below"
            />
            <Button
              onClick={handleGeneratePONumber}
              disabled={isGenerating}
              sx={{ mt: 2 }}
              variant="outlined"
            >
              {isGenerating ? "Generating..." : "Generate PO Number"}
            </Button>
          </Box>
        )}

        {/* Step 3: Price Selection */}
        {activeStep === 2 && (
          <Box>
            {pricesLoading ? (
              <Typography>Loading prices...</Typography>
            ) : (
              <>
                {/* Search Field */}
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search prices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ mb: 2 }}
                />

                {/* Filter Chips */}
                <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {filterByCategory && fulfilment.pimCategoryName && (
                    <Chip
                      label={`Category: ${fulfilment.pimCategoryName}`}
                      onDelete={() => setFilterByCategory(false)}
                      size="small"
                      sx={{ maxWidth: 200 }}
                    />
                  )}
                  {vendorId && fulfilment.contact?.name && (
                    <Chip
                      label={`Vendor: ${fulfilment.contact.name}`}
                      onDelete={() => setVendorId("")}
                      size="small"
                      sx={{ maxWidth: 200 }}
                    />
                  )}
                  {projectId && fulfilment.project?.name && (
                    <Chip
                      label={`Project: ${fulfilment.project.name}`}
                      onDelete={() => setProjectId("")}
                      size="small"
                      sx={{ maxWidth: 200 }}
                    />
                  )}
                </Box>

                {/* Prices Table */}
                <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox"></TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Price Book</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Daily Rate</TableCell>
                        <TableCell align="right">Weekly Rate</TableCell>
                        <TableCell align="right">Monthly Rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {prices
                        .filter((price) => {
                          // Apply category filter (if chip is present)
                          if (filterByCategory && fulfilment.pimCategoryName) {
                            if (price.pimCategoryName !== fulfilment.pimCategoryName) {
                              return false;
                            }
                          }

                          // Apply search filter across all visible data
                          if (searchQuery) {
                            const query = searchQuery.toLowerCase();
                            const matchesSearch =
                              price.name?.toLowerCase().includes(query) ||
                              price.priceBookName.toLowerCase().includes(query) ||
                              price.pimCategoryName.toLowerCase().includes(query);

                            if (!matchesSearch) {
                              return false;
                            }
                          }

                          return true;
                        })
                        .map((price) => (
                          <TableRow
                            key={price.id}
                            hover
                            selected={selectedPriceId === price.id}
                            onClick={() => setSelectedPriceId(price.id)}
                            sx={{ cursor: "pointer" }}
                          >
                            <TableCell padding="checkbox">
                              <Radio checked={selectedPriceId === price.id} />
                            </TableCell>
                            <TableCell>{price.name || "Unnamed"}</TableCell>
                            <TableCell>
                              <Link
                                href={`/app/${workspaceId}/prices/price-books/${price.priceBookId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {price.priceBookName}
                              </Link>
                            </TableCell>
                            <TableCell>{price.pimCategoryName}</TableCell>
                            <TableCell align="right">
                              ${(price.pricePerDayInCents / 100).toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              ${(price.pricePerWeekInCents / 100).toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              ${(price.pricePerMonthInCents / 100).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        )}

        {/* Step 4: Confirmation */}
        {activeStep === 3 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Order Summary
            </Typography>

            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>PO Number</TableCell>
                  <TableCell>{poNumber}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Vendor</TableCell>
                  <TableCell>{vendorId}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Project</TableCell>
                  <TableCell>{fulfilment.project?.name || "None"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                  <TableCell>{fulfilment.pimCategoryName}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Quantity</TableCell>
                  <TableCell>1</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Rental Period</TableCell>
                  <TableCell>
                    {format(rentalStart, "dd/MM/yyyy")} - {format(rentalEnd, "dd/MM/yyyy")} (
                    {totalDays} days)
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Selected Price</TableCell>
                  <TableCell>
                    {selectedPrice?.name || "Unnamed"} - {selectedPrice?.priceBookName}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Estimated Cost</TableCell>
                  <TableCell sx={{ fontSize: "1.1rem", fontWeight: 600 }}>
                    ${estimatedCost.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <Chip
              label="Line item will be created as CONFIRMED"
              color="success"
              size="small"
              sx={{ mt: 2 }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={isSubmitting}>
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button onClick={handleNext} variant="contained">
            Next
          </Button>
        ) : (
          <>
            <Button onClick={() => handleSubmit(false)} variant="outlined" disabled={isSubmitting}>
              Create Draft
            </Button>
            <Button onClick={() => handleSubmit(true)} variant="contained" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create & Submit"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
