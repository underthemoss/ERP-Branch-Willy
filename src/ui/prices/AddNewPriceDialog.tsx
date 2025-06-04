import {
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
import { PimCategoriesTreeView } from "../pim/PimCategoriesTreeView";
import { useCreateRentalPriceMutation } from "./api";

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
  const [formCategoryName, setFormCategoryName] = React.useState<string | null>(null);
  const [formClass, setFormClass] = React.useState("");
  const [formDay, setFormDay] = React.useState("");
  const [formWeek, setFormWeek] = React.useState("");
  const [formMonth, setFormMonth] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  const [createRentalPrice, { loading: creating }] = useCreateRentalPriceMutation({
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
          },
        },
      });
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleClose = () => {
    setFormCategoryId(null);
    setFormCategoryName(null);
    setFormClass("");
    setFormDay("");
    setFormWeek("");
    setFormMonth("");
    setFormError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Rental Price</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <PimCategoriesTreeView
            onItemSelected={(categoryId: string, categoryName?: string) => {
              setFormCategoryId(categoryId);
              setFormCategoryName(categoryName || null);
            }}
          />
          <TextField
            label="Class"
            value={formClass}
            onChange={(e) => setFormClass(e.target.value)}
            required
            fullWidth
          />
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
          {formError && <Typography color="error">{formError}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={creating}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={creating}>
            {creating ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
