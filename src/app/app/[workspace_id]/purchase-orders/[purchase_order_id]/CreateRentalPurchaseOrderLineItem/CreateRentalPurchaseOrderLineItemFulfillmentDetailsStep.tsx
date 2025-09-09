"use client";

import { graphql } from "@/graphql";
import {
  DeliveryMethod,
  useGetPurchaseOrderRentalLineItemByIdCreateDialogQuery,
  useUpdateRentalPurchaseOrderLineCreateDialogMutation,
} from "@/graphql/hooks";
import { AddressValidationField } from "@/ui/contacts/AddressValidationField";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from "@mui/material";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import { MultiInputDateRangeField } from "@mui/x-date-pickers-pro/MultiInputDateRangeField";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs, { Dayjs } from "dayjs";
import React from "react";
import type { CreateRentalPurchaseOrderLineItemFooter } from "./CreateRentalPurchaseOrderLineItemDialog";

export interface FulfillmentDetailsStepProps {
  lineItemId: string;
  Footer: CreateRentalPurchaseOrderLineItemFooter;
}

const CreateRentalPurchaseOrderLineItemFulfillmentDetailsStep: React.FC<
  FulfillmentDetailsStepProps
> = ({ lineItemId, Footer }) => {
  const [fulfillmentMethod, setFulfillmentMethod] = React.useState<"DELIVERY" | "PICKUP">(
    "DELIVERY",
  );

  const [deliveryLocation, setDeliveryLocation] = React.useState<string>("");
  const [deliveryCharge, setDeliveryCharge] = React.useState<string>("0.00");
  const [dateRange, setDateRange] = React.useState<[string | null, string | null]>([null, null]);
  const [locationData, setLocationData] = React.useState<{
    lat: number | null;
    lng: number | null;
    placeId: string;
  }>({ lat: null, lng: null, placeId: "" });
  const [updateLineItem, { loading: mutationLoading }] =
    useUpdateRentalPurchaseOrderLineCreateDialogMutation();
  const { data, loading, error } = useGetPurchaseOrderRentalLineItemByIdCreateDialogQuery({
    variables: { id: lineItemId },
    fetchPolicy: "cache-and-network",
  });
  const item =
    data?.getPurchaseOrderLineItemById?.__typename === "RentalPurchaseOrderLineItem"
      ? data.getPurchaseOrderLineItemById
      : null;
  // Hydrate form state from fetched data
  React.useEffect(() => {
    if (item) {
      setFulfillmentMethod(item.delivery_method || DeliveryMethod.Delivery);
      setDeliveryLocation(item.delivery_location || "");
      setDeliveryCharge(
        typeof item.delivery_charge_in_cents === "number"
          ? (item.delivery_charge_in_cents / 100).toFixed(2)
          : "0.00",
      );
      setDateRange([item.delivery_date || null, item.off_rent_date || null]);
    }
  }, [item]);

  // Convert ISO strings to dayjs objects for the DateRangePicker
  const internalDateRange: [Dayjs | null, Dayjs | null] = [
    dateRange[0] ? dayjs(dateRange[0]) : null,
    dateRange[1] ? dayjs(dateRange[1]) : null,
  ];

  const handleContinue = async () => {
    try {
      // Log location data for future schema updates
      if (locationData.lat && locationData.lng) {
        console.log("Delivery location data for future schema update:", {
          lat: locationData.lat,
          lng: locationData.lng,
          placeId: locationData.placeId,
        });
      }

      await updateLineItem({
        variables: {
          input: {
            id: lineItemId,
            delivery_method: fulfillmentMethod.toUpperCase() as any,
            delivery_location: deliveryLocation,
            delivery_charge_in_cents: Math.round(parseFloat(deliveryCharge || "0") * 100) || 0,
            delivery_date: dateRange[0] || "",
            off_rent_date: dateRange[1] || "",
          },
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <DialogTitle>Fulfillment Details</DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Complete the fields to record a rental. For ownership transfers, check the box to skip
          lease terms.
        </Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Fulfillment Method</InputLabel>
          <Select
            value={fulfillmentMethod}
            onChange={(e) => setFulfillmentMethod(e.target.value as any)}
            label="Fulfillment Method"
          >
            <MenuItem value="DELIVERY">Delivery</MenuItem>
            <MenuItem value="PICKUP">Pickup</MenuItem>
          </Select>
        </FormControl>
        <AddressValidationField
          value={deliveryLocation}
          onChange={(value) => setDeliveryLocation(value)}
          onLocationChange={(lat, lng, placeId) => setLocationData({ lat, lng, placeId })}
          label="Delivery Location"
          fullWidth
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Delivery Charge</InputLabel>
          <OutlinedInput
            value={deliveryCharge}
            onChange={(e) => setDeliveryCharge(e.target.value)}
            label="Delivery Charge"
            onBlur={(ev) => setDeliveryCharge(Number(ev.target.value).toFixed(2))}
            startAdornment={<InputAdornment position="start">$</InputAdornment>}
            endAdornment={<InputAdornment position="end">USD</InputAdornment>}
            inputProps={{ min: 0 }}
          />
        </FormControl>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateRangePicker
            value={internalDateRange}
            onChange={(newValue) => {
              setDateRange([
                newValue[0] ? newValue[0].toISOString() : null,
                newValue[1] ? newValue[1].toISOString() : null,
              ]);
            }}
            slots={{ field: MultiInputDateRangeField }}
            localeText={{
              start: "Delivery Date",
              end: "Off-Rent Date",
            }}
          />
        </LocalizationProvider>
      </DialogContent>
      <Footer nextEnabled={true} loading={mutationLoading} onNextClick={handleContinue} />
    </>
  );
};

export default CreateRentalPurchaseOrderLineItemFulfillmentDetailsStep;
