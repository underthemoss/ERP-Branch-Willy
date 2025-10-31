"use client";

import { PimCategoriesTreeView } from "@/ui/pim/PimCategoriesTreeView";
import {
  Box,
  Button,
  Chip,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { LineItem } from "../../page";
import { StepFooterComponent } from "./AddLineItemDialog";

interface LineItemCategoryStepProps {
  lineItem: Partial<LineItem>;
  onUpdate: (updates: Partial<LineItem>) => void;
  Footer: StepFooterComponent;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  workspaceId: string;
  pricebookId?: string | null;
}

const LineItemCategoryStep: React.FC<LineItemCategoryStepProps> = ({
  lineItem,
  onUpdate,
  Footer,
  onNext,
  onBack,
  onClose,
  workspaceId,
  pricebookId,
}) => {
  const [showNewProduct, setShowNewProduct] = useState(lineItem.isNewProduct || false);
  const [customProductName, setCustomProductName] = useState(lineItem.customProductName || "");
  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    name: string;
  } | null>(
    lineItem.pimCategoryId && lineItem.pimCategoryName
      ? { id: lineItem.pimCategoryId, name: lineItem.pimCategoryName }
      : null,
  );
  const [selectedSearchTerm, setSelectedSearchTerm] = useState<string>("");

  const handleCategorySelect = (item: any) => {
    if (showNewProduct) {
      // In new product mode, just store the category and wait for product name
      setSelectedCategory({ id: item.id, name: item.name });
      onUpdate({
        pimCategoryId: item.id,
        pimCategoryName: item.name,
        isNewProduct: true,
        // Don't clear price selection yet
      });
    } else {
      // Existing product mode - proceed as before
      onUpdate({
        pimCategoryId: item.id,
        pimCategoryName: item.name,
        isNewProduct: false,
        customProductName: undefined,
        // Clear price selection when category changes
        priceId: undefined,
        priceName: undefined,
        priceBookName: undefined,
        unitCostInCents: undefined,
      });
      onNext();
    }
  };

  const handleNewProductToggle = () => {
    const newShowNewProduct = !showNewProduct;
    setShowNewProduct(newShowNewProduct);

    if (newShowNewProduct) {
      // Switching to new product mode
      onUpdate({
        isNewProduct: true,
        // Clear existing product selections
        priceId: undefined,
        priceName: undefined,
        priceBookName: undefined,
        unitCostInCents: undefined,
      });
      // Reset selections for new product mode
      setSelectedCategory(null);
      setCustomProductName("");
    } else {
      // Switching to existing product mode
      onUpdate({
        isNewProduct: false,
        customProductName: undefined,
        // Clear category if it was selected in new product mode
        pimCategoryId: undefined,
        pimCategoryName: undefined,
      });
      setSelectedCategory(null);
      setCustomProductName("");
    }
  };

  const handleProductNameChange = (name: string) => {
    setCustomProductName(name);
    onUpdate({
      customProductName: name,
    });
  };

  const handleSearchTermClick = (term: string) => {
    setSelectedSearchTerm(term);
  };

  // Get search terms from product name
  const getSearchTerms = (productName: string): string[] => {
    if (!productName) return [];
    // Split by spaces and filter out empty strings and very short words
    return productName
      .split(/\s+/)
      .filter((word) => word.length >= 3)
      .map((word) => word.toLowerCase());
  };

  const searchTerms = getSearchTerms(customProductName);

  const handleNewProductNext = () => {
    if (selectedCategory && customProductName.trim()) {
      onUpdate({
        pimCategoryId: selectedCategory.id,
        pimCategoryName: selectedCategory.name,
        customProductName: customProductName.trim(),
        isNewProduct: true,
        isCustomProduct: true,
      });
      onNext();
    }
  };

  const isNextEnabled = showNewProduct
    ? !!selectedCategory && !!customProductName.trim()
    : !!lineItem.pimCategoryId;

  return (
    <>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {showNewProduct ? "Create New Product" : "Select Product Category"}
          </Typography>
          <Button
            variant={showNewProduct ? "contained" : "outlined"}
            size="small"
            onClick={handleNewProductToggle}
          >
            {showNewProduct ? "Existing Product" : "New Product"}
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {showNewProduct ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select a category and enter the product name
              </Typography>

              <TextField
                fullWidth
                label="Product Name"
                value={customProductName}
                onChange={(e) => handleProductNameChange(e.target.value)}
                placeholder="Enter the product name"
                sx={{ mb: 3 }}
                autoFocus
              />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Select Category
              </Typography>

              {searchTerms.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 1, display: "block" }}
                  >
                    Click a term to search for related categories:
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {searchTerms.map((term, index) => (
                      <Chip
                        key={index}
                        label={term}
                        size="small"
                        onClick={() => handleSearchTermClick(term)}
                        sx={{
                          cursor: "pointer",
                          "&:hover": {
                            bgcolor: "primary.light",
                            color: "primary.contrastText",
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Box>
                <PimCategoriesTreeView
                  selectedItemId={selectedCategory?.id || undefined}
                  onItemSelected={handleCategorySelect}
                  includeProducts={false}
                  // Don't filter by pricebook when creating new product
                  pricebookId={undefined}
                  initialSearchValue={selectedSearchTerm}
                />
              </Box>
            </>
          ) : (
            <PimCategoriesTreeView
              selectedItemId={lineItem.pimCategoryId || undefined}
              onItemSelected={handleCategorySelect}
              includeProducts={false}
              pricebookId={pricebookId || undefined}
            />
          )}
        </Box>
      </DialogContent>
      <Footer
        nextEnabled={isNextEnabled}
        onNext={showNewProduct ? handleNewProductNext : onNext}
        onBack={onBack}
        onClose={onClose}
      />
    </>
  );
};

export default LineItemCategoryStep;
