"use client";

import { graphql } from "@/graphql";
import { QuoteLineItemType, QuoteStatus } from "@/graphql/graphql";
import { useSelectedWorkspace } from "@/providers/WorkspaceProvider";
import { ContactSelector } from "@/ui/ContactSelector";
import { ProjectSelector } from "@/ui/ProjectSelector";
import { useMutation } from "@apollo/client";
import DeleteIcon from "@mui/icons-material/Delete";
import InventoryIcon from "@mui/icons-material/Inventory";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { useRouter } from "next/navigation";
import * as React from "react";
import { BrowseCatalogDialog, type PriceHit } from "./BrowseCatalogDialog";
import { LineItemDetailsDialog, type LineItemDetails } from "./LineItemDetailsDialog";

const CREATE_QUOTE_MUTATION = graphql(`
  mutation CreateQuote($input: CreateQuoteInput!) {
    createQuote(input: $input) {
      id
      status
      sellerWorkspaceId
      sellersBuyerContactId
      sellersProjectId
      validUntil
      createdAt
    }
  }
`);

const CREATE_QUOTE_REVISION_MUTATION = graphql(`
  mutation CreateQuoteRevision($input: CreateQuoteRevisionInput!) {
    createQuoteRevision(input: $input) {
      id
      quoteId
      revisionNumber
      validUntil
      createdAt
    }
  }
`);

interface CreateSalesQuoteDialogProps {
  open: boolean;
  onClose: () => void;
}

// Format price in cents to dollars
function formatPrice(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "$0.00";
  return `$${(cents / 100).toFixed(2)}`;
}

export function CreateSalesQuoteDialog({ open, onClose }: CreateSalesQuoteDialogProps) {
  const currentWorkspace = useSelectedWorkspace();
  const router = useRouter();
  const [createQuote, { loading }] = useMutation(CREATE_QUOTE_MUTATION);
  const [createQuoteRevision] = useMutation(CREATE_QUOTE_REVISION_MUTATION);

  const [buyerContactId, setBuyerContactId] = React.useState<string>("");
  const [projectId, setProjectId] = React.useState<string>("");
  const [validForDays, setValidForDays] = React.useState<number>(14);
  const [notes, setNotes] = React.useState<string>("");
  const [lineItems, setLineItems] = React.useState<LineItemDetails[]>([]);
  const [quoteId, setQuoteId] = React.useState<string | null>(null);

  // Dialog state
  const [browseCatalogOpen, setBrowseCatalogOpen] = React.useState(false);
  const [lineItemDetailsOpen, setLineItemDetailsOpen] = React.useState(false);
  const [selectedPrice, setSelectedPrice] = React.useState<PriceHit | null>(null);

  const handleClose = () => {
    // Reset form
    setBuyerContactId("");
    setProjectId("");
    setValidForDays(14);
    setNotes("");
    setLineItems([]);
    setQuoteId(null);
    setSelectedPrice(null);
    onClose();
  };

  const handleSelectPrice = (price: PriceHit) => {
    setSelectedPrice(price);
    setLineItemDetailsOpen(true);
  };

  const handleAddLineItem = async (details: LineItemDetails) => {
    if (!currentWorkspace) return;

    // Add line item to local state
    const newLineItems = [...lineItems, details];
    setLineItems(newLineItems);

    // If this is the first line item, create the quote and revision
    if (!quoteId) {
      try {
        // Calculate validUntil date
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + validForDays);

        // Create the quote
        const { data: quoteData } = await createQuote({
          variables: {
            input: {
              sellerWorkspaceId: currentWorkspace.id,
              sellersBuyerContactId: buyerContactId,
              sellersProjectId: projectId,
              validUntil: validUntil.toISOString(),
              status: QuoteStatus.Draft,
            },
          },
        });

        if (!quoteData?.createQuote?.id) {
          throw new Error("Failed to create quote");
        }

        const newQuoteId = quoteData.createQuote.id;
        setQuoteId(newQuoteId);

        // Create the first revision with the line item
        await createQuoteRevision({
          variables: {
            input: {
              quoteId: newQuoteId,
              revisionNumber: 1,
              validUntil: validUntil.toISOString(),
              lineItems: [
                {
                  type:
                    details.priceType === "RENTAL"
                      ? QuoteLineItemType.Rental
                      : QuoteLineItemType.Sale,
                  description: details.description,
                  pimCategoryId: details.pimCategoryId,
                  quantity: details.quantity,
                  subtotalInCents: details.subtotalInCents,
                  ...(details.priceType === "RENTAL"
                    ? {
                        pricePerDayInCents: details.pricePerDayInCents,
                        pricePerWeekInCents: details.pricePerWeekInCents,
                        pricePerMonthInCents: details.pricePerMonthInCents,
                        rentalStartDate: details.rentalStartDate?.toISOString(),
                        rentalEndDate: details.rentalEndDate?.toISOString(),
                      }
                    : {
                        unitPrice: details.unitCostInCents
                          ? details.unitCostInCents / 100
                          : undefined,
                      }),
                },
              ],
            },
          },
        });
      } catch (error) {
        console.error("Error creating quote/revision:", error);
        // Remove the line item from state if creation failed
        setLineItems(lineItems);
        // TODO: Show error notification
      }
    } else {
      // Update existing revision with new line item
      try {
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + validForDays);

        await createQuoteRevision({
          variables: {
            input: {
              quoteId,
              revisionNumber: 1, // Still revision 1 since we're building the initial quote
              validUntil: validUntil.toISOString(),
              lineItems: newLineItems.map((item) => ({
                type:
                  item.priceType === "RENTAL" ? QuoteLineItemType.Rental : QuoteLineItemType.Sale,
                description: item.description,
                pimCategoryId: item.pimCategoryId,
                quantity: item.quantity,
                subtotalInCents: item.subtotalInCents,
                ...(item.priceType === "RENTAL"
                  ? {
                      pricePerDayInCents: item.pricePerDayInCents,
                      pricePerWeekInCents: item.pricePerWeekInCents,
                      pricePerMonthInCents: item.pricePerMonthInCents,
                      rentalStartDate: item.rentalStartDate?.toISOString(),
                      rentalEndDate: item.rentalEndDate?.toISOString(),
                    }
                  : {
                      unitPrice: item.unitCostInCents ? item.unitCostInCents / 100 : undefined,
                    }),
              })),
            },
          },
        });
      } catch (error) {
        console.error("Error updating revision:", error);
        // Remove the line item from state if update failed
        setLineItems(lineItems);
        // TODO: Show error notification
      }
    }
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
    // Note: In a real implementation, you might want to update the revision on the backend
  };

  const handleCreate = async () => {
    if (!quoteId || !currentWorkspace) {
      return;
    }

    try {
      // Navigate to the quote detail page
      router.push(`/app/${currentWorkspace.id}/quotes/${quoteId}`);
      handleClose();
    } catch (error) {
      console.error("Error navigating to quote:", error);
    }
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + item.subtotalInCents, 0);
  const isFormValid = buyerContactId && projectId && lineItems.length > 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          Create Sales Quote
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Create a new sales quote for your customer
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Buyer Contact <span style={{ color: "#d32f2f" }}>*</span>
              </Typography>
              {currentWorkspace && (
                <ContactSelector
                  workspaceId={currentWorkspace.id}
                  contactId={buyerContactId}
                  onChange={setBuyerContactId}
                  type="any"
                />
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Valid for (days)
              </Typography>
              <TextField
                fullWidth
                type="number"
                value={validForDays}
                onChange={(e) => setValidForDays(parseInt(e.target.value) || 0)}
                slotProps={{
                  htmlInput: { min: 1 },
                }}
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Project <span style={{ color: "#d32f2f" }}>*</span>
              </Typography>
              <ProjectSelector projectId={projectId} onChange={setProjectId} />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Line Items <span style={{ color: "#d32f2f" }}>*</span>
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<InventoryIcon />}
                    sx={{ textTransform: "none" }}
                    onClick={() => setBrowseCatalogOpen(true)}
                  >
                    Browse Catalog
                  </Button>
                  <Button variant="outlined" size="small" sx={{ textTransform: "none" }} disabled>
                    + Add Custom
                  </Button>
                </Box>
              </Box>

              {lineItems.length === 0 ? (
                <Box
                  sx={{
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    p: 6,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#FAFAFA",
                    minHeight: "200px",
                  }}
                >
                  <InventoryIcon sx={{ fontSize: 48, color: "#9CA3AF", mb: 2 }} />
                  <Typography variant="body1" sx={{ color: "#6B7280", fontWeight: 500, mb: 0.5 }}>
                    No products added yet
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#9CA3AF", mb: 3 }}>
                    Browse the catalog or add a custom line item
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<InventoryIcon />}
                    sx={{ textTransform: "none" }}
                    onClick={() => setBrowseCatalogOpen(true)}
                  >
                    Browse Catalog
                  </Button>
                </Box>
              ) : (
                <Box
                  sx={{
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                        <TableCell sx={{ fontWeight: 600 }}>Product Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Transaction</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Rate Type</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">
                          Qty
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">
                          Price
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lineItems.map((item, index) => (
                        <TableRow key={index} hover>
                          <TableCell>{item.priceName}</TableCell>
                          <TableCell>Physical Good</TableCell>
                          <TableCell>{item.priceType === "RENTAL" ? "Rent" : "Sale"}</TableCell>
                          <TableCell>{item.priceType === "RENTAL" ? "Day" : "Unit"}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">
                            {item.priceType === "RENTAL"
                              ? formatPrice(item.pricePerDayInCents)
                              : formatPrice(item.unitCostInCents)}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 200 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.description}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveLineItem(index)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      p: 2,
                      borderTop: "1px solid #E5E7EB",
                      bgcolor: "#F9FAFB",
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Total Amount: {formatPrice(totalAmount)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Notes (Optional)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Add any additional notes or terms..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                size="small"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={!isFormValid || loading}
          sx={{ textTransform: "none" }}
        >
          {loading ? "Creating..." : "Create Quote"}
        </Button>
      </DialogActions>

      {/* Browse Catalog Dialog */}
      {currentWorkspace && (
        <BrowseCatalogDialog
          open={browseCatalogOpen}
          onClose={() => setBrowseCatalogOpen(false)}
          workspaceId={currentWorkspace.id}
          onSelectPrice={handleSelectPrice}
        />
      )}

      {/* Line Item Details Dialog */}
      <LineItemDetailsDialog
        open={lineItemDetailsOpen}
        onClose={() => {
          setLineItemDetailsOpen(false);
          setSelectedPrice(null);
        }}
        price={selectedPrice}
        onSubmit={handleAddLineItem}
      />
    </Dialog>
  );
}
