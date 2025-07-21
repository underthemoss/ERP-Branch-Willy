"use client";

import {
  PriceType,
  useGetSalesOrderSaleLineItemByIdCreateDialogQuery,
  useUpdateSaleSalesOrderLineCreateDialogMutation,
} from "@/graphql/hooks";
import { useGetPimCategoryByIdQuery } from "@/ui/pim/api";
import { useCreateSalePriceMutation, useListPricesQuery } from "@/ui/prices/api";
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
import React, { useMemo, useState } from "react";
import { CreateSaleLineItemFooter } from "./CreateSaleLineItemDialog";

const formatCentsToUSD = (cents: number | null): string => {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2);
};

type PriceOption = {
  id: string;
  name: string;
  unitCostInCents: number;
  priceBookName: string;
  priceBook?: {
    id: string;
    name: string;
  } | null;
};

export interface PricingSelectionStepProps {
  lineItemId: string;
  Footer: CreateSaleLineItemFooter;
  pimCategoryId: string;
}

const CreateSaleLineItemPricingSelectionStep: React.FC<PricingSelectionStepProps> = ({
  lineItemId,
  Footer,
  pimCategoryId,
}) => {
  const [updateLineItem, { loading: mutationLoading }] =
    useUpdateSaleSalesOrderLineCreateDialogMutation();

  const { data, loading, error, refetch } = useGetSalesOrderSaleLineItemByIdCreateDialogQuery({
    variables: { id: lineItemId },
    fetchPolicy: "cache-and-network",
  });

  const { data: pimCategoryData } = useGetPimCategoryByIdQuery({
    variables: {
      id: pimCategoryId,
    },
  });

  const {
    data: pricesData,
    loading: pricesLoading,
    refetch: refetchPrices,
  } = useListPricesQuery({
    fetchPolicy: "cache-and-network",
    variables: {
      priceType: PriceType.Sale,
      shouldListPriceBooks: true,
      pimCategoryId: pimCategoryId,
      page: {
        size: 1000,
      },
    },
  });

  const [selectedPrice, setSelectedPrice] = useState("");
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({
    ids: new Set<string>(),
    type: "include",
  });

  // Pre-select the existing price when editing
  React.useEffect(() => {
    if (data?.getSalesOrderLineItemById?.__typename === "SaleSalesOrderLineItem") {
      const lineItem = data.getSalesOrderLineItemById;
      const existingPriceId = lineItem.price_id;
      if (existingPriceId && !selectedPrice) {
        setSelectedPrice(existingPriceId);
        setRowSelectionModel({
          ids: new Set([existingPriceId]),
          type: "include",
        });
      }
    }
  }, [data, selectedPrice]);
  const [showAddPriceDialog, setShowAddPriceDialog] = useState(false);
  const [formData, setFormData] = useState({
    priceBookId: "",
    name: "",
    unitCostInCents: "",
  });

  const [createSalePrice, { loading: createPriceLoading }] = useCreateSalePriceMutation();

  const rentalPrices: PriceOption[] = useMemo(
    () =>
      (pricesData?.listPrices?.items || [])
        ?.map((p) => (p.__typename === "SalePrice" ? p : null))
        .filter(Boolean)
        .map((p) => ({
          id: p?.id || "",
          name: p?.name || "",
          priceBookName: p?.priceBook?.name || "Custom Prices",
          priceBookId: p?.priceBook?.id || undefined,
          priceBook: p?.priceBook || undefined,
          unitCostInCents: p?.unitCostInCents || 0,
        })),
    [pricesData],
  );

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Class",
      flex: 1,
    },
    {
      field: "priceBookName",
      headerName: "Price Book",
    },
    {
      field: "unitCostInCents",
      headerName: "Unit Cost",
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams) => {
        return params.value != null ? `$${formatCentsToUSD(params.value as number)}` : "-";
      },
    },
  ];

  const rowGroupingModel = ["priceBookName"];

  const apiRef = useGridApiRef();

  const initialState = useKeepGroupedColumnsHidden({
    apiRef,
    initialState: {
      rowGrouping: {
        model: rowGroupingModel,
      },
    },
  });

  const priceBooks = useMemo(
    () => pricesData?.listPriceBooks?.items || [],
    [pricesData?.listPriceBooks?.items],
  );

  const handleSavePrice = async () => {
    try {
      const input: any = {
        pimCategoryId,
        name: formData.name,
      };

      if (formData.priceBookId) {
        input.priceBookId = formData.priceBookId;
      }

      if (formData.unitCostInCents) {
        input.unitCostInCents = Math.round(parseFloat(formData.unitCostInCents) * 100);
      }

      const result = await createSalePrice({
        variables: { input },
      });

      if (result.data?.createSalePrice?.id) {
        // Store the price book name to expand
        const priceBookName = formData.priceBookId
          ? priceBooks.find((pb) => pb.id === formData.priceBookId)?.name
          : "Custom Prices";

        // Refetch prices
        await refetchPrices();

        // Select the newly created price
        setRowSelectionModel({
          ids: new Set([result.data.createSalePrice.id]),
          type: "include",
        });
        setSelectedPrice(result.data.createSalePrice.id);

        // Expand the price book group where the new price was added
        if (priceBookName && apiRef.current) {
          // Use setTimeout to ensure the grid has updated with new data
          setTimeout(() => {
            if (apiRef.current) {
              const groupId = `auto-generated-row-priceBookName/${priceBookName}`;
              apiRef.current.setRowChildrenExpansion(groupId, true);
            }
          }, 100);
        }

        // Close dialog and reset form
        setShowAddPriceDialog(false);
        setFormData({
          priceBookId: "",
          name: "",
          unitCostInCents: "",
        });
      }
    } catch (error) {
      console.error("Error creating price:", error);
    }
  };

  return (
    <>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption">{pimCategoryData?.getPimCategoryById?.path}</Typography>
            <br />
            Select pricing: {pimCategoryData?.getPimCategoryById?.name}
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={() => setShowAddPriceDialog(true)}
            sx={{ mt: 1, alignSelf: "flex-end" }}
          >
            Add New Price
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 0 }}>
        <Box sx={{ height: 400, width: "100%" }}>
          <DataGridPremium
            apiRef={apiRef}
            rows={rentalPrices}
            columns={columns}
            loading={loading || pricesLoading}
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
      <Footer
        loading={loading || mutationLoading}
        nextEnabled={!!selectedPrice}
        onNextClick={async () => {
          await updateLineItem({
            variables: {
              input: {
                id: lineItemId,
                price_id: selectedPrice,
              },
            },
          });

          await refetch();
        }}
      />

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
            <FormControl fullWidth>
              <InputLabel id="price-book-label">Price Book</InputLabel>
              <Select
                labelId="price-book-label"
                value={formData.priceBookId}
                label="Price Book"
                onChange={(e) => setFormData({ ...formData, priceBookId: e.target.value })}
              >
                <MenuItem value="">
                  <em>None</em>
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
              placeholder="Product class or name"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />

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
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddPriceDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSavePrice}
            variant="contained"
            disabled={!formData.name || createPriceLoading}
          >
            {createPriceLoading ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CreateSaleLineItemPricingSelectionStep;
