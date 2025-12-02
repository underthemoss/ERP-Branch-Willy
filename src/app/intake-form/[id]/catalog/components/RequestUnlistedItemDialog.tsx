"use client";

import { PimCategoryFields, PimProductFields } from "@/ui/pim/api";
import { PimCategoriesTreeView } from "@/ui/pim/PimCategoriesTreeView";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { Package, X } from "lucide-react";
import { useState } from "react";
import { PriceHit } from "../context/CartContext";

interface SelectedCategory {
  id: string;
  name: string;
  path?: string;
}

interface RequestUnlistedItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (customPriceHit: PriceHit) => void;
}

export default function RequestUnlistedItemDialog({
  open,
  onClose,
  onSubmit,
}: RequestUnlistedItemDialogProps) {
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemType, setItemType] = useState<"RENTAL" | "SALE">("RENTAL");
  const [selectedCategory, setSelectedCategory] = useState<SelectedCategory | null>(null);

  const handleCategorySelect = (item: PimCategoryFields | PimProductFields) => {
    if (!item.id || !item.name) return;
    // Only accept categories (products don't have 'path')
    const path = "path" in item ? item.path : undefined;
    setSelectedCategory({
      id: item.id,
      name: item.name,
      path: path ?? undefined,
    });
  };

  const handleSubmit = () => {
    if (!itemName.trim() || !selectedCategory) return;

    // Create a synthetic PriceHit for the unlisted item
    const customPriceHit: PriceHit = {
      objectID: `custom-${crypto.randomUUID()}`,
      _id: `custom-${crypto.randomUUID()}`,
      workspaceId: "",
      name: itemName.trim(),
      priceType: itemType,
      pimCategoryId: selectedCategory.id,
      pimCategoryPath: selectedCategory.path || "",
      pimCategoryName: selectedCategory.name,
      pimProductId: null,
      priceBookId: null,
      // No pricing info for custom items
      pricePerDayInCents: null,
      pricePerWeekInCents: null,
      pricePerMonthInCents: null,
      unitCostInCents: null,
      price_book: null,
      location: null,
      // Store description in a custom field - we'll handle this specially
      category_lvl1: itemDescription || undefined,
    };

    onSubmit(customPriceHit);
    handleClose();
  };

  const handleClose = () => {
    setItemName("");
    setItemDescription("");
    setItemType("RENTAL");
    setSelectedCategory(null);
    onClose();
  };

  const isValid = itemName.trim().length > 0 && selectedCategory !== null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Package className="w-5 h-5" />
          <Typography variant="h6">Request Unlisted Item</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Can&apos;t find what you need? Describe the item and we&apos;ll help you get it.
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Item Name */}
          <TextField
            label="Item Name"
            placeholder="e.g., 20-ton Crane, Concrete Mixer"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            fullWidth
            required
            autoFocus
          />

          {/* Item Description */}
          <TextField
            label="Description / Specifications"
            placeholder="Describe any specific requirements, model preferences, or specifications..."
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />

          {/* Rental or Sale */}
          <FormControl>
            <Typography variant="subtitle2" gutterBottom>
              Request Type
            </Typography>
            <RadioGroup
              row
              value={itemType}
              onChange={(e) => setItemType(e.target.value as "RENTAL" | "SALE")}
            >
              <FormControlLabel
                value="RENTAL"
                control={<Radio size="small" />}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700">
                      RENTAL
                    </span>
                  </Box>
                }
              />
              <FormControlLabel
                value="SALE"
                control={<Radio size="small" />}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">
                      PURCHASE
                    </span>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>

          {/* Category Selection */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Category *
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              Select the category that best matches your requested item
            </Typography>

            {selectedCategory ? (
              <Box
                sx={{
                  p: 2,
                  bgcolor: "primary.50",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "primary.200",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {selectedCategory.name}
                  </Typography>
                  {selectedCategory.path && (
                    <Typography variant="caption" color="text.secondary">
                      {selectedCategory.path}
                    </Typography>
                  )}
                </Box>
                <Button
                  size="small"
                  onClick={() => setSelectedCategory(null)}
                  sx={{ minWidth: "auto", p: 0.5 }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "grey.300",
                  borderRadius: 1,
                  maxHeight: 300,
                  overflow: "auto",
                }}
              >
                <PimCategoriesTreeView
                  onItemSelected={handleCategorySelect}
                  includeProducts={false}
                />
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!isValid}>
          Continue to Delivery Details
        </Button>
      </DialogActions>
    </Dialog>
  );
}
