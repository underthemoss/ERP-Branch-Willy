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
import { useCreateRentalPriceMutation, useCreateSalePriceMutation } from "./api";

interface AddNewPriceDialogProps {
  open: boolean;
  onClose: () => void;
  priceBookId: string;
  onSuccess?: () => void;
}

export function AddNewPriceDialog({
  open,
  onClose,
  priceBookId,
  onSuccess,
}: AddNewPriceDialogProps) {
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
              priceBookId,
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
              priceBookId,
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
      <DialogTitle>Add Price</DialogTitle>
      <form onSubmit={rhfHandleSubmit(onFormSubmit)}>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <PimCategoriesTreeView
            onItemSelected={(item) => {
              if (item.__typename === "PimCategory") {
                setFormCategoryId(item.id ?? null);
                setSelectedProduct(null);
                setValue("class", "");
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
                  placeholder="Assoicated Attributes, e.g. weight class or a dimension"
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
