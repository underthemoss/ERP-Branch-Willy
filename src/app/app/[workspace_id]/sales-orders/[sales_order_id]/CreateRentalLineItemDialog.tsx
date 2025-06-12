"use client";

import { graphql } from "@/graphql";
import { useCreateSalesOrderLineItemMutation } from "@/graphql/hooks";
import { PimProductsTreeView } from "@/ui/pim/PimProductsTreeView";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

// GQL mutation declaration (for codegen)
graphql(`
  mutation createSalesOrderLineItem($input: CreateSalesOrderLineItemInput!) {
    createSalesOrderLineItem(input: $input) {
      id
      so_pim_id
      so_quantity
    }
  }
`);

interface CreateRentalLineItemDialogProps {
  open: boolean;
  onClose: () => void;
  salesOrderId: string;
  onSuccess: () => void;
}

export const CreateRentalLineItemDialog: React.FC<CreateRentalLineItemDialogProps> = ({
  open,
  onClose,
  salesOrderId,
  onSuccess,
}) => {
  // Multistep state for rental wizard
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Product selection
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Step 2: Pricing
  const [selectedPrice, setSelectedPrice] = useState<number | null>(0);

  // Step 3: Fulfillment
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"Delivery" | "Pickup">("Delivery");
  const [deliveryLocation, setDeliveryLocation] = useState<string>(
    "3274 Doe Meadow Drive, Annapolis Junction, MD 20701",
  );
  const [deliveryCharge, setDeliveryCharge] = useState<string>("0.00");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [daysRented, setDaysRented] = useState<string>("");

  // Step 4: Notes
  const [deliveryNotes, setDeliveryNotes] = useState<string>("");

  const [soPimId, setSoPimId] = useState<string>("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

  const [createLineItem, { loading }] = useCreateSalesOrderLineItemMutation();

  const handleClose = () => {
    setSoPimId("");
    setQuantity("");
    setError(null);
    setStep(1);
    setSelectedCategory(null);
    setSelectedProduct(null);
    setSearchTerm("");
    setSelectedPrice(0);
    setFulfillmentMethod("Delivery");
    setDeliveryLocation("3274 Doe Meadow Drive, Annapolis Junction, MD 20701");
    setDeliveryCharge("0.00");
    setDeliveryDate("");
    setDaysRented("");
    setDeliveryNotes("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Only validate on last step
    if (step !== 4) return;
    // TODO: Add validation for required fields if needed
    try {
      // TODO: Pass all collected data to mutation if needed
      await createLineItem({
        variables: {
          input: {
            so_pim_id: soPimId || selectedProduct || "mock-product-id",
            so_quantity: 1, // Default to 1 for now
            sales_order_id: salesOrderId,
            // transaction_type: transactionType, // Uncomment if needed in schema
            // price: selectedPrice,
            // fulfillment: { ... }
            // notes: deliveryNotes,
          },
        },
      });
      handleClose();
      onSuccess();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    }
  };

  // (No transaction type selection here; this is the rental wizard only)

  // Mock data for product categories and products
  const mockCategories = [
    {
      name: "Earthmoving equipment",
      products: [
        "Articulated Wheel Loaders",
        "Backhoes",
        "Track Skid Loaders",
        "Wheeled Skid Loaders",
        "Compact Wheel Loaders",
        "Electric Mini Excavators",
        "Medium Track Excavators",
      ],
    },
    {
      name: "Aerial Work Platforms",
      products: ["Articulating Boom Lifts", "Atrium Lifts", "Track Skid Loaders"],
    },
  ];

  // Mock data for pricing
  const mockPricing = [
    {
      id: 1,
      label: "323 - Tier 4 / Stage V",
      prices: { "1 Day": "$55", "1 week": "$136", "4 weeks": "$375" },
    },
    {
      id: 2,
      label: "323 - Tier 4 / Stage V",
      prices: { "1 Day": "$55", "1 week": "$136", "4 weeks": "$375" },
    },
    {
      id: 3,
      label: "323 - Tier 4 / Stage V",
      prices: { "1 Day": "$55", "1 week": "$136", "4 weeks": "$375" },
    },
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      {/* Step 1: Select product */}
      {step === 1 && (
        <>
          <DialogTitle>Select a Product Category</DialogTitle>
          <DialogContent sx={{ pt: 1, pb: 0 }}>
            <TextField
              fullWidth
              placeholder="Search for equipment"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 2 }}
              size="small"
            />
            <Stack spacing={2}>
              {mockCategories.map((cat) => (
                <Box key={cat.name} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 1 }}>
                    {cat.name}
                  </Typography>
                  <Stack spacing={1}>
                    {cat.products
                      .filter((p) => p.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((product) => (
                        <Paper
                          key={product}
                          variant="outlined"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            p: 2,
                            cursor: "pointer",
                            borderColor: selectedProduct === product ? "primary.main" : "grey.300",
                            boxShadow: selectedProduct === product ? 2 : 0,
                          }}
                          onClick={() => setSelectedProduct(product)}
                        >
                          <Box sx={{ flexGrow: 1 }}>{product}</Box>
                          <IconButton
                            edge="end"
                            size="small"
                            sx={{
                              color: "grey.500",
                              pointerEvents: "none",
                            }}
                          >
                            <ArrowForwardIosIcon />
                          </IconButton>
                        </Paper>
                      ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button variant="contained" onClick={() => setStep(2)} disabled={!selectedProduct}>
              Continue
            </Button>
          </DialogActions>
        </>
      )}

      {/* Step 2: Select price */}
      {step === 2 && (
        <>
          <DialogTitle>Select pricing</DialogTitle>
          <DialogContent sx={{ pt: 1, pb: 0 }}>
            <Box sx={{ display: "flex", mb: 2, fontWeight: 600 }}>
              <Box sx={{ flex: 2 }}>Pricing Tier</Box>
              <Box sx={{ flex: 1, textAlign: "center" }}>1 Day</Box>
              <Box sx={{ flex: 1, textAlign: "center" }}>1 week</Box>
              <Box sx={{ flex: 1, textAlign: "center" }}>4 weeks</Box>
            </Box>
            <Stack spacing={1}>
              {mockPricing.map((tier, idx) => (
                <Paper
                  key={tier.id}
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
                    {tier.label}
                  </Box>
                  <Box sx={{ flex: 1, textAlign: "center" }}>{tier.prices["1 Day"]}</Box>
                  <Box sx={{ flex: 1, textAlign: "center" }}>{tier.prices["1 week"]}</Box>
                  <Box sx={{ flex: 1, textAlign: "center" }}>{tier.prices["4 weeks"]}</Box>
                </Paper>
              ))}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => setStep(3)}
              disabled={selectedPrice === null}
            >
              Continue
            </Button>
          </DialogActions>
        </>
      )}

      {/* Step 3: Fulfillment details */}
      {step === 3 && (
        <>
          <DialogTitle>Fulfillment Details</DialogTitle>
          <DialogContent sx={{ pt: 1, pb: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Complete the fields to record a sale. For ownership transfers, check the box to skip
              lease terms.
            </Typography>
            <TextField
              select
              label="Fulfillment Method"
              value={fulfillmentMethod}
              onChange={(e) => setFulfillmentMethod(e.target.value as "Delivery" | "Pickup")}
              SelectProps={{ native: true }}
              fullWidth
              sx={{ mb: 2 }}
            >
              <option value="Delivery">Delivery</option>
              <option value="Pickup">Pickup</option>
            </TextField>
            <TextField
              label="Delivery Location"
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Delivery Charge"
              value={deliveryCharge}
              onChange={(e) => setDeliveryCharge(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <span style={{ marginRight: 4 }}>$</span>,
                inputProps: { min: 0 },
              }}
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Delivery date"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Days Rented"
                value={daysRented}
                onChange={(e) => setDaysRented(e.target.value)}
                sx={{ flex: 1 }}
                placeholder="# of days"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button variant="contained" onClick={() => setStep(4)}>
              Continue
            </Button>
          </DialogActions>
        </>
      )}

      {/* Step 4: Delivery notes */}
      {step === 4 && (
        <form onSubmit={handleSubmit}>
          <DialogTitle>Delivery Contact & Notes</DialogTitle>
          <DialogContent sx={{ pt: 1, pb: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Contact + special instructions for the driver.
            </Typography>
            <TextField
              multiline
              minRows={4}
              fullWidth
              placeholder="Jordan Smith — 512-555-0123. Use east gate off 5th St, unload near staging area."
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Finish
            </Button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  );
};

export default CreateRentalLineItemDialog;
