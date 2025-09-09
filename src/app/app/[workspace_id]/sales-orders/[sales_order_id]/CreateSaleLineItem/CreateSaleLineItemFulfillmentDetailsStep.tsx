"use client";

import {
  DeliveryMethod,
  useGetSalesOrderSaleLineItemByIdCreateDialogQuery,
  useUpdateSaleSalesOrderLineCreateDialogMutation,
} from "@/graphql/hooks";
import { AddressValidationField } from "@/ui/contacts/AddressValidationField";
import {
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
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs, { Dayjs } from "dayjs";
import React from "react";
import type { CreateSaleLineItemFooter } from "./CreateSaleLineItemDialog";

export interface FulfillmentDetailsStepProps {
  lineItemId: string;
  Footer: CreateSaleLineItemFooter;
}

const CreateSaleLineItemFulfillmentDetailsStep: React.FC<FulfillmentDetailsStepProps> = ({
  lineItemId,
  Footer,
}) => {
  const [fulfillmentMethod, setFulfillmentMethod] = React.useState<"DELIVERY" | "PICKUP">(
    "DELIVERY",
  );
  const [deliveryLocation, setDeliveryLocation] = React.useState<string>("");
  const [deliveryCharge, setDeliveryCharge] = React.useState<string>("0.00");
  const [deliveryDate, setDeliveryDate] = React.useState<string | null>(null);
  const [locationData, setLocationData] = React.useState<{
    lat: number | null;
    lng: number | null;
    placeId: string;
  }>({ lat: null, lng: null, placeId: "" });

  const [updateLineItem, { loading: mutationLoading }] =
    useUpdateSaleSalesOrderLineCreateDialogMutation();

  const { data, loading, error } = useGetSalesOrderSaleLineItemByIdCreateDialogQuery({
    variables: { id: lineItemId },
    fetchPolicy: "cache-and-network",
  });

  const item =
    data?.getSalesOrderLineItemById?.__typename === "SaleSalesOrderLineItem"
      ? data.getSalesOrderLineItemById
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
      setDeliveryDate(item.delivery_date || null);
    }
  }, [item]);

  // Convert ISO string to dayjs object for the DatePicker
  const deliveryDateDayjs: Dayjs | null = deliveryDate ? dayjs(deliveryDate) : null;

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
            delivery_date: deliveryDate || "",
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
          Specify how and when the sale item will be delivered or picked up.
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
            inputProps={{ min: 0, type: "number", step: "0.01" }}
          />
        </FormControl>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Delivery Date"
            value={deliveryDateDayjs}
            onChange={(newValue) => {
              setDeliveryDate(newValue ? newValue.toISOString() : null);
            }}
            slotProps={{
              textField: {
                fullWidth: true,
              },
            }}
          />
        </LocalizationProvider>
      </DialogContent>
      <Footer nextEnabled={true} loading={mutationLoading} onNextClick={handleContinue} />
    </>
  );
};

export default CreateSaleLineItemFulfillmentDetailsStep;
