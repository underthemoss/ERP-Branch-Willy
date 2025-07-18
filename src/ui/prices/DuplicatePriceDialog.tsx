"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { PimProductFields } from "../pim/api";
import { PimCategoriesTreeView } from "../pim/PimCategoriesTreeView";
import {
  useCreateRentalPriceMutation,
  useCreateSalePriceMutation,
  type RentalPriceFields,
  type SalePriceFields,
} from "./api";

interface DuplicatePriceDialogProps {
  open: boolean;
  onClose: () => void;
  price: RentalPriceFields | SalePriceFields | null;
  onSuccess?: () => void;
}

export function DuplicatePriceDialog({
  open,
  onClose,
  price,
  onSuccess,
}: DuplicatePriceDialogProps) {
  const isRentalPrice = price?.__typename === "RentalPrice";
  const isSalePrice = price?.__typename === "SalePrice";

  const [formCategoryId, setFormCategoryId] = React.useState<string | null>(null);
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
      unitCost: "",
    },
  });
  const [formError, setFormError] = React.useState<string | null>(null);
  const [priceType, setPriceType] = React.useState<"rental" | "sale">("rental");

  // Set initial values when price changes
  React.useEffect(() => {
    if (price) {
      setFormCategoryId(price.pimCategoryId);
      setValue("class", price.name || "");

      if (isRentalPrice) {
        setPriceType("rental");
        const rentalPrice = price as RentalPriceFields;
        setValue("day", (rentalPrice.pricePerDayInCents / 100).toFixed(2));
        setValue("week", (rentalPrice.pricePerWeekInCents / 100).toFixed(2));
        setValue("month", (rentalPrice.pricePerMonthInCents / 100).toFixed(2));
      } else if (isSalePrice) {
        setPriceType("sale");
        const salePrice = price as SalePriceFields;
        setValue("unitCost", (salePrice.unitCostInCents / 100).toFixed(2));
      }
    }
  }, [price, isRentalPrice, isSalePrice, setValue]);

  const [createRentalPrice, { loading: creatingRental }] = useCreateRentalPriceMutation({
    onCompleted: () => {
      handleClose();
      if (onSuccess) onSuccess();
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
    refetchQueries: ["ListPrices"],
  });

  const [createSalePrice, { loading: creatingSale }] = useCreateSalePriceMutation({
    onCompleted: () => {
      handleClose();
      if (onSuccess) onSuccess();
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
    refetchQueries: ["ListPrices"],
  });

  function parseDollarToCents(val: string) {
    const num = Number(val.replace(/[^0-9.]/g, ""));
    return isNaN(num) ? 0 : Math.round(num * 100);
  }

  // react-hook-form submit handler
  const onFormSubmit = async (data: any) => {
    setFormError(null);
    if (!formCategoryId) {
      setFormError("Category is required.");
      return;
    }
    if (priceType === "rental") {
      try {
        await createRentalPrice({
          variables: {
            input: {
              name: data.class,
              pimCategoryId: formCategoryId,
              priceBookId: price?.priceBook?.id || "",
              pricePerDayInCents: parseDollarToCents(data.day),
              pricePerWeekInCents: parseDollarToCents(data.week),
              pricePerMonthInCents: parseDollarToCents(data.month),
              pimProductId: selectedProduct?.id ?? null,
            },
          },
        });
      } catch (err: any) {
        setFormError(err.message);
      }
    } else if (priceType === "sale") {
      if (!data.unitCost) {
        setFormError("Unit Cost is required.");
        return;
      }
      try {
        await createSalePrice({
          variables: {
            input: {
              name: data.class,
              pimCategoryId: formCategoryId,
              priceBookId: price?.priceBook?.id || "",
              unitCostInCents: parseDollarToCents(data.unitCost),
              pimProductId: selectedProduct?.id ?? null,
              discounts: [],
            },
          },
        });
      } catch (err: any) {
        setFormError(err.message);
      }
    }
  };

  const handleClose = () => {
    setFormCategoryId(null);
    setFormError(null);
    setSelectedProduct(null);
    setPriceType("rental");
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Duplicate Price</DialogTitle>
      <form onSubmit={rhfHandleSubmit(onFormSubmit)}>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Duplicating from: {price?.pimCategoryName} {price?.name && `- ${price.name}`}
          </Typography>

          <PimCategoriesTreeView
            includeProducts
            selectedItemId={price?.pimCategoryId}
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
                  placeholder=""
                  fullWidth
                  error={!!errors.class}
                  helperText={errors.class?.message}
                />
              )}
            />
          )}
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={priceType}
              onChange={(_, v) => setPriceType(v)}
              aria-label="Price Type Tabs"
            >
              <Tab label="Rental" value="rental" />
              <Tab label="Sale" value="sale" />
            </Tabs>
          </Box>
          {priceType === "rental" ? (
            <>
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
            </>
          ) : (
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
          )}
          {formError && <Typography color="error">{formError}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={creatingRental || creatingSale}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={creatingRental || creatingSale}
          >
            {creatingRental || creatingSale ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
