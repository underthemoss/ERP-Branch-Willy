"use client";

import { PriceType } from "@/graphql/graphql";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
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
import {
  useCreateRentalPriceMutation,
  useCreateSalePriceMutation,
  useListPricesQuery,
} from "./api";

const formatCentsToUSD = (cents: number | null): string => {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2);
};

type PriceOption = {
  id: string;
  name: string;
  type: "RENTAL" | "SALE";
  pricePerDayInCents?: number;
  pricePerWeekInCents?: number;
  pricePerMonthInCents?: number;
  unitCostInCents?: number;
  priceBookName: string;
  priceBook?: {
    id: string;
    name: string;
  } | null;
};

interface PriceSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (priceId: string) => void;
  workspaceId: string;
  pimCategoryId?: string;
  priceType?: "RENTAL" | "SALE" | "BOTH";
  title?: string;
  selectedPriceId?: string;
  priceBookId?: string; // Optional: filter by specific pricebook
  comparisonPrice?: {
    id: string;
    name?: string;
    type: "RENTAL" | "SALE";
    dayPrice?: number;
    weekPrice?: number;
    monthPrice?: number;
    unitCost?: number;
  };
}

export function PriceSelectionDialog({
  open,
  onClose,
  onSelect,
  workspaceId,
  pimCategoryId,
  priceType = "BOTH",
  title = "Select Price",
  selectedPriceId,
  priceBookId,
  comparisonPrice,
}: PriceSelectionDialogProps) {
  const apiRef = useGridApiRef();
  const [selectedPrice, setSelectedPrice] = useState<string>("");
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({
    ids: new Set<string>(),
    type: "include",
  });
  const [showAddPriceDialog, setShowAddPriceDialog] = useState(false);
  const [newPriceType, setNewPriceType] = useState<"RENTAL" | "SALE">(
    priceType === "SALE" ? "SALE" : "RENTAL",
  );
  const [formData, setFormData] = useState({
    priceBookId: priceBookId || "",
    name: "",
    pricePerDayInCents: "",
    pricePerWeekInCents: "",
    pricePerMonthInCents: "",
    unitCostInCents: "",
  });

  // Update newPriceType when priceType prop changes
  useEffect(() => {
    if (priceType === "SALE") {
      setNewPriceType("SALE");
    } else if (priceType === "RENTAL") {
      setNewPriceType("RENTAL");
    }
    // For "BOTH", keep the current selection
  }, [priceType]);

  // Fetch prices
  const {
    data: pricesData,
    loading: pricesLoading,
    refetch: refetchPrices,
  } = useListPricesQuery({
    fetchPolicy: "cache-and-network",
    variables: {
      workspaceId,
      priceType:
        priceType === "RENTAL"
          ? PriceType.Rental
          : priceType === "SALE"
            ? PriceType.Sale
            : undefined,
      shouldListPriceBooks: true,
      pimCategoryId: pimCategoryId || undefined,
      priceBookId: priceBookId || undefined,
      page: {
        size: 1000,
      },
    },
  });

  const [createRentalPrice, { loading: createRentalLoading }] = useCreateRentalPriceMutation();
  const [createSalePrice, { loading: createSaleLoading }] = useCreateSalePriceMutation();

  // Process prices data
  const prices: PriceOption[] = useMemo(() => {
    const items = pricesData?.listPrices?.items || [];
    return items
      .map((p) => {
        if (p.__typename === "RentalPrice") {
          return {
            id: p.id,
            name: p.name || "",
            type: "RENTAL" as const,
            priceBookName: p.priceBook?.name || "Custom Prices",
            priceBook: p.priceBook || undefined,
            pricePerDayInCents: p.pricePerDayInCents,
            pricePerWeekInCents: p.pricePerWeekInCents,
            pricePerMonthInCents: p.pricePerMonthInCents,
          };
        } else if (p.__typename === "SalePrice") {
          return {
            id: p.id,
            name: p.name || "",
            type: "SALE" as const,
            priceBookName: p.priceBook?.name || "Custom Prices",
            priceBook: p.priceBook || undefined,
            unitCostInCents: p.unitCostInCents,
          };
        }
        return null;
      })
      .filter(Boolean) as PriceOption[];
  }, [pricesData]);

  const priceBooks = useMemo(
    () => pricesData?.listPriceBooks?.items || [],
    [pricesData?.listPriceBooks?.items],
  );

  // Define columns based on price type
  const columns: GridColDef[] = useMemo(() => {
    const baseColumns: GridColDef[] = [
      {
        field: "name",
        headerName: "Class",
        flex: 1,
      },
      {
        field: "priceBookName",
        headerName: "Price Book",
        width: 150,
      },
    ];

    if (priceType === "RENTAL" || priceType === "BOTH") {
      baseColumns.push(
        {
          field: "type",
          headerName: "Type",
          width: 80,
          renderCell: (params: GridRenderCellParams) => {
            return params.value || "-";
          },
        },
        {
          field: "pricePerDayInCents",
          headerName: "1 Day",
          width: 100,
          align: "center",
          headerAlign: "center",
          renderCell: (params: GridRenderCellParams) => {
            return params.value != null ? `$${formatCentsToUSD(params.value as number)}` : "-";
          },
        },
        {
          field: "pricePerWeekInCents",
          headerName: "1 Week",
          width: 100,
          align: "center",
          headerAlign: "center",
          renderCell: (params: GridRenderCellParams) => {
            return params.value != null ? `$${formatCentsToUSD(params.value as number)}` : "-";
          },
        },
        {
          field: "pricePerMonthInCents",
          headerName: "4 Weeks",
          width: 100,
          align: "center",
          headerAlign: "center",
          renderCell: (params: GridRenderCellParams) => {
            return params.value != null ? `$${formatCentsToUSD(params.value as number)}` : "-";
          },
        },
      );
    }

    if (priceType === "SALE" || priceType === "BOTH") {
      baseColumns.push({
        field: "unitCostInCents",
        headerName: "Unit Cost",
        width: 100,
        align: "center",
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams) => {
          return params.value != null ? `$${formatCentsToUSD(params.value as number)}` : "-";
        },
      });
    }

    return baseColumns;
  }, [priceType]);

  const rowGroupingModel = ["priceBookName"];

  const initialState = useKeepGroupedColumnsHidden({
    apiRef,
    initialState: {
      rowGrouping: {
        model: rowGroupingModel,
      },
    },
  });

  // Sync selection with selectedPriceId prop
  useEffect(() => {
    if (open && selectedPriceId) {
      setSelectedPrice(selectedPriceId);
      setRowSelectionModel({
        ids: new Set([selectedPriceId]),
        type: "include",
      });

      // Find and expand the price book containing this price
      const selectedPriceData = prices.find((p) => p.id === selectedPriceId);
      if (selectedPriceData && apiRef.current) {
        setTimeout(() => {
          if (apiRef.current) {
            const groupId = `auto-generated-row-priceBookName/${selectedPriceData.priceBookName}`;
            apiRef.current.setRowChildrenExpansion(groupId, true);
          }
        }, 100);
      }
    } else if (open && !selectedPriceId) {
      // Clear selection if no price is provided
      setSelectedPrice("");
      setRowSelectionModel({
        ids: new Set(),
        type: "include",
      });
    }
  }, [open, selectedPriceId, prices, apiRef]);

  const handleSavePrice = async () => {
    try {
      if (newPriceType === "RENTAL") {
        const input: any = {
          pimCategoryId: pimCategoryId || "",
          name: formData.name,
          workspaceId,
        };

        if (formData.priceBookId && formData.priceBookId !== "custom-price") {
          input.priceBookId = formData.priceBookId;
        }

        if (formData.pricePerDayInCents) {
          input.pricePerDayInCents = Math.round(parseFloat(formData.pricePerDayInCents) * 100);
        }

        if (formData.pricePerWeekInCents) {
          input.pricePerWeekInCents = Math.round(parseFloat(formData.pricePerWeekInCents) * 100);
        }

        if (formData.pricePerMonthInCents) {
          input.pricePerMonthInCents = Math.round(parseFloat(formData.pricePerMonthInCents) * 100);
        }

        const result = await createRentalPrice({
          variables: { input },
        });

        if (result.data?.createRentalPrice?.id) {
          const priceBookName = formData.priceBookId
            ? priceBooks.find((pb) => pb.id === formData.priceBookId)?.name
            : "Custom Prices";

          await refetchPrices();

          setRowSelectionModel({
            ids: new Set([result.data.createRentalPrice.id]),
            type: "include",
          });
          setSelectedPrice(result.data.createRentalPrice.id);

          if (priceBookName && apiRef.current) {
            setTimeout(() => {
              if (apiRef.current) {
                const groupId = `auto-generated-row-priceBookName/${priceBookName}`;
                apiRef.current.setRowChildrenExpansion(groupId, true);
              }
            }, 100);
          }

          setShowAddPriceDialog(false);
          resetForm();
        }
      } else {
        const input: any = {
          pimCategoryId: pimCategoryId || "",
          name: formData.name,
          workspaceId,
          discounts: [],
        };

        if (formData.priceBookId && formData.priceBookId !== "custom-price") {
          input.priceBookId = formData.priceBookId;
        }

        if (formData.unitCostInCents) {
          input.unitCostInCents = Math.round(parseFloat(formData.unitCostInCents) * 100);
        }

        const result = await createSalePrice({
          variables: { input },
        });

        if (result.data?.createSalePrice?.id) {
          const priceBookName = formData.priceBookId
            ? priceBooks.find((pb) => pb.id === formData.priceBookId)?.name
            : "Custom Prices";

          await refetchPrices();

          setRowSelectionModel({
            ids: new Set([result.data.createSalePrice.id]),
            type: "include",
          });
          setSelectedPrice(result.data.createSalePrice.id);

          if (priceBookName && apiRef.current) {
            setTimeout(() => {
              if (apiRef.current) {
                const groupId = `auto-generated-row-priceBookName/${priceBookName}`;
                apiRef.current.setRowChildrenExpansion(groupId, true);
              }
            }, 100);
          }

          setShowAddPriceDialog(false);
          resetForm();
        }
      }
    } catch (error) {
      console.error("Error creating price:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      priceBookId: priceBookId || "",
      name: "",
      pricePerDayInCents: "",
      pricePerWeekInCents: "",
      pricePerMonthInCents: "",
      unitCostInCents: "",
    });
    // Reset price type based on the dialog's priceType prop
    if (priceType === "SALE") {
      setNewPriceType("SALE");
    } else if (priceType === "RENTAL") {
      setNewPriceType("RENTAL");
    }
    // For "BOTH", keep the current selection
  };

  const handleConfirm = () => {
    if (selectedPrice) {
      onSelect(selectedPrice);
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{title}</Typography>
            <Button
              variant="contained"
              size="small"
              onClick={() => setShowAddPriceDialog(true)}
              sx={{ ml: 2 }}
            >
              Add New Price
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 0 }}>
          {/* Show comparison price if provided */}
          {comparisonPrice && (
            <Box
              sx={{
                mb: 2,
                p: 2,
                backgroundColor: "primary.50",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "primary.200",
              }}
            >
              <Typography variant="subtitle2" color="primary.main" gutterBottom>
                Sales Order Price for Comparison:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                {comparisonPrice.name || "Unnamed Price"}
              </Typography>
              <Box sx={{ display: "flex", gap: 3 }}>
                {comparisonPrice.type === "RENTAL" ? (
                  <>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        1 Day:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        ${formatCentsToUSD(comparisonPrice.dayPrice || 0)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        1 Week:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        ${formatCentsToUSD(comparisonPrice.weekPrice || 0)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        4 Weeks:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        ${formatCentsToUSD(comparisonPrice.monthPrice || 0)}
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Unit Cost:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      ${formatCentsToUSD(comparisonPrice.unitCost || 0)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
          <Box sx={{ height: 400, width: "100%" }}>
            <DataGridPremium
              apiRef={apiRef}
              rows={prices}
              columns={columns}
              loading={pricesLoading}
              rowGroupingModel={rowGroupingModel}
              checkboxSelection
              disableMultipleRowSelection
              rowSelectionModel={rowSelectionModel}
              onRowSelectionModelChange={({ ids, type }) => {
                const idArray = Array.from(ids).filter(
                  (value) => !value.toString().startsWith("auto-generated-row"),
                );
                if (idArray.length <= 1) {
                  setRowSelectionModel({
                    ids,
                    type,
                  });
                  if (idArray.length === 0) {
                    setSelectedPrice("");
                  }
                  if (idArray[0]) {
                    setSelectedPrice(idArray[0] as string);
                  }
                }
              }}
              sx={{
                "& .MuiDataGrid-row": {
                  cursor: "pointer",
                },
                "& .MuiDataGrid-cell:focus": {
                  outline: "none",
                },
                "& .MuiDataGrid-cell:focus-within": {
                  outline: "none",
                },
              }}
              hideFooter
              density="compact"
              groupingColDef={{
                flex: 1,
              }}
              initialState={initialState}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} variant="contained" disabled={!selectedPrice}>
            Select Price
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add New Price Dialog */}
      <Dialog
        open={showAddPriceDialog}
        onClose={() => setShowAddPriceDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Price</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {priceType === "BOTH" && (
              <FormControl fullWidth>
                <InputLabel id="price-type-label">Price Type</InputLabel>
                <Select
                  labelId="price-type-label"
                  value={newPriceType}
                  label="Price Type"
                  onChange={(e) => setNewPriceType(e.target.value as "RENTAL" | "SALE")}
                >
                  <MenuItem value="RENTAL">Rental</MenuItem>
                  <MenuItem value="SALE">Sale</MenuItem>
                </Select>
              </FormControl>
            )}

            <FormControl fullWidth>
              <InputLabel id="price-book-label">Price Book</InputLabel>
              <Select
                labelId="price-book-label"
                value={formData.priceBookId}
                label="Price Book"
                onChange={(e) => setFormData({ ...formData, priceBookId: e.target.value })}
              >
                <MenuItem key="custom-price" value="custom-price">
                  <em>Custom Price</em>
                </MenuItem>
                {priceBooks.map((priceBook) => (
                  <MenuItem key={priceBook.id} value={priceBook.id}>
                    {priceBook.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Class"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />

            {newPriceType === "RENTAL" ? (
              <>
                <TextField
                  label="1 Day Price"
                  value={formData.pricePerDayInCents}
                  onChange={(e) => setFormData({ ...formData, pricePerDayInCents: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  type="number"
                  inputProps={{ step: "0.01", min: "0" }}
                  fullWidth
                />

                <TextField
                  label="1 Week Price"
                  value={formData.pricePerWeekInCents}
                  onChange={(e) =>
                    setFormData({ ...formData, pricePerWeekInCents: e.target.value })
                  }
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  type="number"
                  inputProps={{ step: "0.01", min: "0" }}
                  fullWidth
                />

                <TextField
                  label="4 Weeks Price"
                  value={formData.pricePerMonthInCents}
                  onChange={(e) =>
                    setFormData({ ...formData, pricePerMonthInCents: e.target.value })
                  }
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  type="number"
                  inputProps={{ step: "0.01", min: "0" }}
                  fullWidth
                />
              </>
            ) : (
              <TextField
                label="Unit Cost"
                value={formData.unitCostInCents}
                onChange={(e) => setFormData({ ...formData, unitCostInCents: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                type="number"
                inputProps={{ step: "0.01", min: "0" }}
                fullWidth
                required
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddPriceDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSavePrice}
            variant="contained"
            disabled={!formData.name || createRentalLoading || createSaleLoading}
          >
            {createRentalLoading || createSaleLoading ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
