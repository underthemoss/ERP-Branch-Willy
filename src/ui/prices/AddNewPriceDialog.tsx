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
  const [formClass, setFormClass] = React.useState("");
  const [formDay, setFormDay] = React.useState("");
  const [formWeek, setFormWeek] = React.useState("");
  const [formMonth, setFormMonth] = React.useState("");
  const [formUnitCost, setFormUnitCost] = React.useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formCategoryId || !formClass) {
      setFormError("Category and Class are required.");
      return;
    }
    if (priceType === "rental") {
      try {
        await createRentalPrice({
          variables: {
            input: {
              name: formClass,
              pimCategoryId: formCategoryId,
              priceBookId,
              pricePerDayInCents: parseDollarToCents(formDay),
              pricePerWeekInCents: parseDollarToCents(formWeek),
              pricePerMonthInCents: parseDollarToCents(formMonth),
              pimProductId: selectedProduct?.id ?? null,
            },
          },
        });
      } catch (err: any) {
        setFormError(err.message);
      }
    } else if (priceType === "sale") {
      if (!formUnitCost) {
        setFormError("Unit Cost is required.");
        return;
      }
      try {
        await createSalePrice({
          variables: {
            input: {
              name: formClass,
              pimCategoryId: formCategoryId,
              priceBookId,
              unitCostInCents: parseDollarToCents(formUnitCost),
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
    setFormClass("");
    setFormDay("");
    setFormWeek("");
    setFormMonth("");
    setFormUnitCost("");
    setFormError(null);
    setSelectedProduct(null);
    setPriceType("rental");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Price</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <PimCategoriesTreeView
            onItemSelected={(item) => {
              if (item.__typename === "PimCategory") {
                setFormCategoryId(item.id ?? null);
                setSelectedProduct(null);
                setFormClass("");
              } else if (item.__typename === "PimProduct") {
                setFormCategoryId(item.pim_category_platform_id ?? null);
                setFormClass(item.name ?? "");
                setSelectedProduct(item);
              }
            }}
          />
          {!selectedProduct && (
            <TextField
              label="Class"
              value={formClass}
              onChange={(e) => setFormClass(e.target.value)}
              required
              fullWidth
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
              <TextField
                label="Day Price"
                value={formDay}
                onChange={(e) => setFormDay(e.target.value)}
                required
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  inputMode: "decimal",
                }}
              />
              <TextField
                label="Week Price"
                value={formWeek}
                onChange={(e) => setFormWeek(e.target.value)}
                required
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  inputMode: "decimal",
                }}
              />
              <TextField
                label="4-Week Price"
                value={formMonth}
                onChange={(e) => setFormMonth(e.target.value)}
                required
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  inputMode: "decimal",
                }}
              />
            </>
          ) : (
            <TextField
              label="Unit Cost"
              value={formUnitCost}
              onChange={(e) => setFormUnitCost(e.target.value)}
              required
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                inputMode: "decimal",
              }}
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
