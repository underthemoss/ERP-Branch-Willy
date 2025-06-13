"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";

export interface ConfirmationStepProps {
  productName: string;
  priceTier: string;
  priceBookName?: string;
  pricePerDay?: string;
  pricePerWeek?: string;
  pricePerMonth?: string;
  fulfillmentMethod: "Delivery" | "Pickup";
  deliveryLocation: string;
  deliveryCharge: string;
  deliveryDate: string;
  offRentDate: string;
  deliveryNotes: string;
  rentalCostBreakdown?: string[];
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

const CreateRentalLineItemConfirmationStep: React.FC<ConfirmationStepProps> = ({
  productName,
  priceTier,
  priceBookName,
  pricePerDay,
  pricePerWeek,
  pricePerMonth,
  fulfillmentMethod,
  deliveryLocation,
  deliveryCharge,
  deliveryDate,
  offRentDate,
  deliveryNotes,
  rentalCostBreakdown,
  onCancel,
  onSubmit,
  onBack,
}) => (
  <form onSubmit={onSubmit}>
    <DialogTitle sx={{ pb: 0 }}>
      <Typography variant="h5" fontWeight={700}>
        Review & Confirm Rental Line Item
      </Typography>
    </DialogTitle>
    <DialogContent sx={{ pt: 0, pb: 0 }}>
      <Card elevation={0} sx={{ mb: 2, bgcolor: "background.paper", borderRadius: 2 }}>
        <CardContent>
          <Stack spacing={3}>
            {/* Product Section */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Product
              </Typography>
              <Typography variant="h6" fontWeight={700} color="primary.main">
                {productName}
              </Typography>
            </Box>
            <Divider />
            {/* Pricing Section */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Pricing
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body1" fontWeight={500}>
                  Tier:
                </Typography>
                <Typography variant="body1">{priceTier}</Typography>
              </Stack>
              {priceBookName && (
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body1" fontWeight={500}>
                    Price Book:
                  </Typography>
                  <Typography variant="body1">{priceBookName}</Typography>
                </Stack>
              )}
              <Stack direction="row" spacing={4} mt={1}>
                <Stack>
                  <Typography variant="body2" color="text.secondary">
                    1 Day
                  </Typography>
                  <Typography variant="body1">{pricePerDay || "-"}</Typography>
                </Stack>
                <Stack>
                  <Typography variant="body2" color="text.secondary">
                    1 Week
                  </Typography>
                  <Typography variant="body1">{pricePerWeek || "-"}</Typography>
                </Stack>
                <Stack>
                  <Typography variant="body2" color="text.secondary">
                    4 Weeks
                  </Typography>
                  <Typography variant="body1">{pricePerMonth || "-"}</Typography>
                </Stack>
              </Stack>
              {rentalCostBreakdown && rentalCostBreakdown.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="primary" fontWeight={600}>
                    Rental Cost Breakdown
                  </Typography>
                  {rentalCostBreakdown.map((line, index) => (
                    <Typography
                      key={index}
                      variant={line.toLowerCase().includes("total cost") ? "h6" : "body2"}
                      fontWeight={line.toLowerCase().includes("total cost") ? 700 : 400}
                      color={line.toLowerCase().includes("total cost") ? "success.main" : undefined}
                      sx={{ pl: 1 }}
                    >
                      {line}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
            <Divider />
            {/* Fulfillment Section */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Fulfillment
              </Typography>
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body1" fontWeight={500}>
                    Method:
                  </Typography>
                  <Typography variant="body1">{fulfillmentMethod}</Typography>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body1" fontWeight={500}>
                    Location:
                  </Typography>
                  <Typography variant="body1">{deliveryLocation}</Typography>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body1" fontWeight={500}>
                    Charge:
                  </Typography>
                  <Typography variant="body1">${deliveryCharge}</Typography>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body1" fontWeight={500}>
                    Delivery Date:
                  </Typography>
                  <Typography variant="body1">{deliveryDate}</Typography>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body1" fontWeight={500}>
                    Off Rent Date:
                  </Typography>
                  <Typography variant="body1">{offRentDate}</Typography>
                </Stack>
              </Stack>
            </Box>
            <Divider />
            {/* Delivery Notes Section */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Delivery Notes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {deliveryNotes || "-"}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </DialogContent>
    <DialogActions
      sx={{
        bgcolor: "grey.100",
        borderTop: 1,
        borderColor: "divider",
        px: 3,
        py: 1.5,
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <Button onClick={onCancel} color="inherit">
        Cancel
      </Button>
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button onClick={onBack} color="inherit">
          Back
        </Button>
        <Button type="submit" variant="contained" color="primary">
          Confirm
        </Button>
      </Box>
    </DialogActions>
  </form>
);

export default CreateRentalLineItemConfirmationStep;
