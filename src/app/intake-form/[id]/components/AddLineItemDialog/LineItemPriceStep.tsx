"use client";

import { PriceType, useListPricesQuery } from "@/graphql/hooks";
import {
  Box,
  Button,
  CircularProgress,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import {
  DataGridPremium,
  GridColDef,
  GridRenderCellParams,
  GridRowSelectionModel,
  useGridApiRef,
  useKeepGroupedColumnsHidden,
} from "@mui/x-data-grid-premium";
import React, { useEffect, useMemo, useState } from "react";
import { NewLineItem } from "../../page";
import { StepFooterComponent } from "./AddLineItemDialog";

interface LineItemPriceStepProps {
  lineItem: Partial<NewLineItem>;
  onUpdate: (updates: Partial<NewLineItem>) => void;
  Footer: StepFooterComponent;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  pricebookId?: string | null;
  workspaceId: string;
}

const formatCentsToUSD = (cents: number | null): string => {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2);
};

type PriceOption = {
  id: string;
  name: string;
  unitCostInCents?: number;
  pricePerDayInCents?: number;
  pricePerWeekInCents?: number;
  pricePerMonthInCents?: number;
  priceBookName: string;
  priceType: string;
};

const LineItemPriceStep: React.FC<LineItemPriceStepProps> = ({
  lineItem,
  onUpdate,
  Footer,
  onNext,
  onBack,
  onClose,
  pricebookId,
  workspaceId,
}) => {
  const [showCustomProduct, setShowCustomProduct] = useState(lineItem.isCustomProduct || false);
  const [customProductName, setCustomProductName] = useState(lineItem.customProductName || "");
  const [selectedPrice, setSelectedPrice] = useState(lineItem.priceId || "");
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({
    ids: new Set<string>(lineItem.priceId ? [lineItem.priceId] : []),
    type: "include",
  });

  const apiRef = useGridApiRef();

  // Query prices based on category and pricebook
  const { data: pricesData, loading: pricesLoading } = useListPricesQuery({
    fetchPolicy: "cache-and-network",
    variables: {
      workspaceId,
      priceType: lineItem.type === "RENTAL" ? PriceType.Rental : PriceType.Sale,
      pimCategoryId: lineItem.pimCategoryId,
      ...(pricebookId ? { priceBookId: pricebookId } : {}),
      shouldListPriceBooks: false,
      page: {
        size: 1000,
      },
    },
    skip: !lineItem.pimCategoryId || showCustomProduct,
  });

  const prices: PriceOption[] = useMemo(() => {
    if (!pricesData?.listPrices?.items) return [];

    return pricesData.listPrices.items
      .map((p) => {
        if (p.__typename === "SalePrice") {
          return {
            id: p.id,
            name: p.name || "",
            unitCostInCents: p.unitCostInCents || 0,
            priceBookName: p.priceBook?.name || "No Price Book",
            priceType: "SALE",
          };
        } else if (p.__typename === "RentalPrice") {
          return {
            id: p.id,
            name: p.name || "",
            pricePerDayInCents: p.pricePerDayInCents || 0,
            pricePerWeekInCents: p.pricePerWeekInCents || 0,
            pricePerMonthInCents: p.pricePerMonthInCents || 0,
            priceBookName: p.priceBook?.name || "No Price Book",
            priceType: "RENTAL",
          };
        }
        return null;
      })
      .filter(Boolean) as PriceOption[];
  }, [pricesData]);

  // Pre-select existing price when editing
  useEffect(() => {
    if (lineItem.priceId && !selectedPrice) {
      setSelectedPrice(lineItem.priceId);
      setRowSelectionModel({
        ids: new Set([lineItem.priceId]),
        type: "include",
      });
    }
  }, [lineItem.priceId, selectedPrice]);

  const handlePriceSelection = (ids: Set<string>) => {
    const idArray = Array.from(ids);
    if (idArray.length === 1) {
      const priceId = idArray[0];
      const price = prices.find((p) => p.id === priceId);
      if (price) {
        setSelectedPrice(priceId);
        onUpdate({
          priceId: priceId,
          priceName: price.name,
          priceBookName: price.priceBookName,
          unitCostInCents: price.unitCostInCents,
          // Add rental pricing fields
          pricePerDayInCents: price.pricePerDayInCents,
          pricePerWeekInCents: price.pricePerWeekInCents,
          pricePerMonthInCents: price.pricePerMonthInCents,
          isCustomProduct: false,
          customProductName: undefined,
        });
      }
    } else {
      setSelectedPrice("");
      onUpdate({
        priceId: undefined,
        priceName: undefined,
        priceBookName: undefined,
        unitCostInCents: undefined,
        pricePerDayInCents: undefined,
        pricePerWeekInCents: undefined,
        pricePerMonthInCents: undefined,
      });
    }
  };

  const handleCustomProductToggle = () => {
    const newShowCustom = !showCustomProduct;
    setShowCustomProduct(newShowCustom);
    if (newShowCustom) {
      // Clear price selection
      setSelectedPrice("");
      setRowSelectionModel({ ids: new Set(), type: "include" });
      onUpdate({
        isCustomProduct: true,
        priceId: undefined,
        priceName: undefined,
        priceBookName: undefined,
        unitCostInCents: undefined,
      });
    } else {
      // Clear custom product
      setCustomProductName("");
      onUpdate({
        isCustomProduct: false,
        customProductName: undefined,
      });
    }
  };

  const handleCustomProductNameChange = (name: string) => {
    setCustomProductName(name);
    onUpdate({
      customProductName: name,
    });
  };

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Class",
      flex: 1,
    },
    ...(lineItem.type === "PURCHASE"
      ? [
          {
            field: "unitCostInCents",
            headerName: "Unit Cost",
            width: 120,
            align: "center" as const,
            headerAlign: "center" as const,
            renderCell: (params: GridRenderCellParams) => {
              return params.value != null ? `$${formatCentsToUSD(params.value as number)}` : "-";
            },
          },
        ]
      : [
          {
            field: "pricePerDayInCents",
            headerName: "Daily",
            width: 100,
            align: "center" as const,
            headerAlign: "center" as const,
            renderCell: (params: GridRenderCellParams) => {
              return params.value != null ? `$${formatCentsToUSD(params.value as number)}` : "-";
            },
          },
          {
            field: "pricePerWeekInCents",
            headerName: "Weekly",
            width: 100,
            align: "center" as const,
            headerAlign: "center" as const,
            renderCell: (params: GridRenderCellParams) => {
              return params.value != null ? `$${formatCentsToUSD(params.value as number)}` : "-";
            },
          },
          {
            field: "pricePerMonthInCents",
            headerName: "Monthly",
            width: 100,
            align: "center" as const,
            headerAlign: "center" as const,
            renderCell: (params: GridRenderCellParams) => {
              return params.value != null ? `$${formatCentsToUSD(params.value as number)}` : "-";
            },
          },
        ]),
  ];

  // Don't group if there's only one pricebook
  const shouldGroup = !pricebookId && prices.some((p) => p.priceBookName !== "No Price Book");
  const rowGroupingModel = shouldGroup ? ["priceBookName"] : [];

  const initialState = useKeepGroupedColumnsHidden({
    apiRef,
    initialState: {
      rowGrouping: {
        model: rowGroupingModel,
      },
    },
  });

  const isNextEnabled = showCustomProduct ? !!customProductName.trim() : !!selectedPrice;

  // If this is a custom product from the start (no category), show custom product form
  if (lineItem.isCustomProduct && !lineItem.pimCategoryId) {
    return (
      <>
        <DialogTitle>Enter Product Details</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter the name of the product you need
            </Typography>

            <TextField
              fullWidth
              label="Product Name"
              value={customProductName}
              onChange={(e) => handleCustomProductNameChange(e.target.value)}
              placeholder="e.g., Special Equipment Model XYZ"
              autoFocus
            />
          </Box>
        </DialogContent>
        <Footer
          nextEnabled={!!customProductName.trim()}
          onNext={onNext}
          onBack={onBack}
          onClose={onClose}
        />
      </>
    );
  }

  // Note: New product flow now skips this step entirely and goes directly to delivery

  return (
    <>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">Select Product</Typography>
            <Typography variant="caption" color="text.secondary">
              {lineItem.pimCategoryName || "Category"}
            </Typography>
          </Box>
          <Button
            variant={showCustomProduct ? "contained" : "outlined"}
            size="small"
            onClick={handleCustomProductToggle}
            sx={{ mt: 1 }}
          >
            {showCustomProduct ? "Browse Products" : "New Product"}
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 0 }}>
        {showCustomProduct ? (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Product Name"
              value={customProductName}
              onChange={(e) => handleCustomProductNameChange(e.target.value)}
              placeholder="e.g., Special Equipment Model XYZ"
              autoFocus
            />
          </Box>
        ) : (
          <Box sx={{ height: 350, width: "100%" }}>
            {pricesLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
              </Box>
            ) : prices.length === 0 ? (
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                height="100%"
              >
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  No products found for this category
                </Typography>
                <Button variant="outlined" onClick={handleCustomProductToggle}>
                  Add New Product
                </Button>
              </Box>
            ) : (
              <DataGridPremium
                apiRef={apiRef}
                rows={prices}
                columns={columns}
                loading={pricesLoading}
                rowGroupingModel={rowGroupingModel}
                checkboxSelection
                disableMultipleRowSelection
                rowSelectionModel={rowSelectionModel}
                onRowSelectionModelChange={({ ids }) => {
                  const filteredIds = Array.from(ids).filter(
                    (value) => !value.toString().startsWith("auto-generated-row"),
                  );
                  if (filteredIds.length <= 1) {
                    setRowSelectionModel({ ids, type: "include" });
                    handlePriceSelection(new Set(filteredIds as string[]));
                  }
                }}
                sx={{
                  "& .MuiDataGrid-row": {
                    cursor: "pointer",
                  },
                }}
                hideFooter
                density="compact"
                groupingColDef={{
                  flex: 1,
                }}
                initialState={initialState}
              />
            )}
          </Box>
        )}
      </DialogContent>
      <Footer nextEnabled={isNextEnabled} onNext={onNext} onBack={onBack} onClose={onClose} />
    </>
  );
};

export default LineItemPriceStep;
