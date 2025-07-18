"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { PimProductFields } from "../pim/api";
import { PimCategoriesTreeView } from "../pim/PimCategoriesTreeView";
import { RentalPriceFields, useUpdateRentalPriceMutation } from "./api";

interface EditRentalPriceDialogProps {
  open: boolean;
  onClose: () => void;
  price: RentalPriceFields;
  onSuccess?: () => void;
}

export function EditRentalPriceDialog({
  open,
  onClose,
  price,
  onSuccess,
}: EditRentalPriceDialogProps) {
  const [formCategoryId, setFormCategoryId] = React.useState<string | null>(price.pimCategoryId);
  const [selectedProduct, setSelectedProduct] = React.useState<PimProductFields | null>(null);

  // react-hook-form setup
  const {
    control,
    handleSubmit: rhfHandleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      class: "",
      day: "",
      week: "",
      month: "",
    },
  });

  const [formError, setFormError] = React.useState<string | null>(null);

  const [updateRentalPrice, { loading: updating }] = useUpdateRentalPriceMutation({
    onCompleted: () => {
      handleClose();
      if (onSuccess) onSuccess();
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  function parseDollarToCents(val: string) {
    const num = Number(val.replace(/[^0-9.]/g, ""));
    return isNaN(num) ? 0 : Math.round(num * 100);
  }

  // react-hook-form submit handler
  const onFormSubmit = async (data: any) => {
    setFormError(null);
    try {
      await updateRentalPrice({
        variables: {
          input: {
            id: price.id,
            name: data.class || undefined,
            pricePerDayInCents: parseDollarToCents(data.day),
            pricePerWeekInCents: parseDollarToCents(data.week),
            pricePerMonthInCents: parseDollarToCents(data.month),
            pimCategoryId: formCategoryId,
          },
        },
      });
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleClose = () => {
    setFormError(null);
    reset();
    onClose();
  };

  // Reset form when price changes
  React.useEffect(() => {
    reset({
      class: price.name || "",
      day: price.pricePerDayInCents ? (price.pricePerDayInCents / 100).toFixed(2) : "",
      week: price.pricePerWeekInCents ? (price.pricePerWeekInCents / 100).toFixed(2) : "",
      month: price.pricePerMonthInCents ? (price.pricePerMonthInCents / 100).toFixed(2) : "",
    });
  }, [price, reset]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Rental Price</DialogTitle>
      <form onSubmit={rhfHandleSubmit(onFormSubmit)}>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <PimCategoriesTreeView
            selectedItemId={price.pimCategoryId}
            onItemSelected={(item) => {
              if (item.__typename === "PimCategory") {
                setFormCategoryId(item.id ?? null);
                setSelectedProduct(null);
              } else if (item.__typename === "PimProduct") {
                setFormCategoryId(item.pim_category_platform_id ?? null);
                setValue("class", item.name ?? "");
                setSelectedProduct(item);
              }
            }}
          />
          {!selectedProduct && (
            <Controller
              name="class"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Class"
                  placeholder="Associated Attributes, e.g. weight class or a dimension"
                  fullWidth
                  error={!!errors.class}
                  helperText={errors.class?.message}
                />
              )}
            />
          )}
          <Controller
            name="day"
            control={control}
            rules={{ required: "Day Price is required" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Day Price"
                required
                fullWidth
                error={!!errors.day}
                helperText={errors.day?.message}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  inputMode: "decimal",
                }}
              />
            )}
          />
          <Controller
            name="week"
            control={control}
            rules={{ required: "Week Price is required" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Week Price"
                required
                fullWidth
                error={!!errors.week}
                helperText={errors.week?.message}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  inputMode: "decimal",
                }}
              />
            )}
          />
          <Controller
            name="month"
            control={control}
            rules={{ required: "4-Week Price is required" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="4-Week Price"
                required
                fullWidth
                error={!!errors.month}
                helperText={errors.month?.message}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  inputMode: "decimal",
                }}
              />
            )}
          />
          {formError && <Typography color="error">{formError}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={updating}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={updating}>
            {updating ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
