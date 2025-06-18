"use client";

import { graphql } from "@/graphql";
import {
  DeliveryMethod,
  useGetSalesOrderRentalLineItemByIdCreateDialogQuery,
  useUpdateRentalSalesOrderLineCreateDialogMutation,
} from "@/graphql/hooks";
import SearchIcon from "@mui/icons-material/Search";
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
import type { CreateRentalLineItemFooter } from "./CreateRentalLineItemDialog";

export interface FulfillmentDetailsStepProps {
  lineItemId: string;
  Footer: CreateRentalLineItemFooter;
}

const CreateRentalLineItemFulfillmentDetailsStep: React.FC<FulfillmentDetailsStepProps> = ({
  lineItemId,
  Footer,
}) => {
  const [fulfillmentMethod, setFulfillmentMethod] = React.useState<"DELIVERY" | "PICKUP">(
    "DELIVERY",
  );

  const [deliveryLocation, setDeliveryLocation] = React.useState<string>("");
  const [deliveryCharge, setDeliveryCharge] = React.useState<string>("0.00");
  const [dateRange, setDateRange] = React.useState<[string | null, string | null]>([null, null]);
  const [updateLineItem, { loading: mutationLoading }] =
    useUpdateRentalSalesOrderLineCreateDialogMutation();
  const { data, loading, error } = useGetSalesOrderRentalLineItemByIdCreateDialogQuery({
    variables: { id: lineItemId },
    fetchPolicy: "cache-and-network",
  });
  const item =
    data?.getSalesOrderLineItemById?.__typename === "RentalSalesOrderLineItem"
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
      setDateRange([item.delivery_date || null, item.off_rent_date || null]);
    }
  }, [data]);

  // Convert ISO strings to dayjs objects for the DateRangePicker
  const internalDateRange: [Dayjs | null, Dayjs | null] = [
    dateRange[0] ? dayjs(dateRange[0]) : null,
    dateRange[1] ? dayjs(dateRange[1]) : null,
  ];

  // Convert dayjs objects back to ISO strings when date changes
  const handleDateRangeChange = (newValue: [Dayjs | null, Dayjs | null]) => {
    setDateRange([
      newValue[0] ? newValue[0].toISOString() : null,
      newValue[1] ? newValue[1].toISOString() : null,
    ]);
  };

  const handleContinue = async () => {
    try {
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
          Complete the fields to record a sale. For ownership transfers, check the box to skip lease
          terms.
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
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Delivery Location</InputLabel>
          <OutlinedInput
            value={deliveryLocation}
            onChange={(e) => setDeliveryLocation(e.target.value)}
            label="Delivery Location"
            startAdornment={<SearchIcon sx={{ color: "action.active", mr: 1, my: 0.5 }} />}
          />
        </FormControl>
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
            onChange={handleDateRangeChange}
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

export default CreateRentalLineItemFulfillmentDetailsStep;
