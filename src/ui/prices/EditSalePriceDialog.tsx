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
import { SalePriceFields, useUpdateSalePriceMutation } from "./api";

interface EditSalePriceDialogProps {
  open: boolean;
  onClose: () => void;
  price: SalePriceFields;
  onSuccess?: () => void;
}

export function EditSalePriceDialog({ open, onClose, price, onSuccess }: EditSalePriceDialogProps) {
  // react-hook-form setup
  const {
    control,
    handleSubmit: rhfHandleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      class: price.name || "",
      unitCost: price.unitCostInCents ? (price.unitCostInCents / 100).toFixed(2) : "",
    },
  });

  const [formError, setFormError] = React.useState<string | null>(null);

  const [updateSalePrice, { loading: updating }] = useUpdateSalePriceMutation({
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
      await updateSalePrice({
        variables: {
          input: {
            id: price.id,
            name: data.class || undefined,
            unitCostInCents: parseDollarToCents(data.unitCost),
            // discounts and pimProductId can be updated if needed in the future
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
      unitCost: price.unitCostInCents ? (price.unitCostInCents / 100).toFixed(2) : "",
    });
  }, [price, reset]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Sale Price</DialogTitle>
      <form onSubmit={rhfHandleSubmit(onFormSubmit)}>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Category
            </Typography>
            <Typography>{price.pimCategoryName}</Typography>
          </Box>
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
          <Controller
            name="unitCost"
            control={control}
            rules={{ required: "Unit Cost is required" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Unit Cost"
                required
                fullWidth
                error={!!errors.unitCost}
                helperText={errors.unitCost?.message}
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
