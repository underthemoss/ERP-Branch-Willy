"use client";

import {
  PriceType,
  useGetSalesOrderRentalLineItemByIdCreateDialogQuery,
  useUpdateRentalSalesOrderLineCreateDialogMutation,
} from "@/graphql/hooks";
import { useGetPimCategoryByIdQuery } from "@/ui/pim/api";
import { useCreateRentalPriceMutation, useListPricesQuery } from "@/ui/prices/api";
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
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { CreateRentalLineItemFooter } from "./CreateRentalLineItemDialog";

const formatCentsToUSD = (cents: number | null): string => {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2);
};

type PriceOption = {
  id: string;
  name: string;
  pricePerDayInCents?: number;
  pricePerWeekInCents?: number;
  pricePerMonthInCents?: number;
  priceBookName: string;
  priceBook?: {
    id: string;
    name: string;
  } | null;
};

export interface PricingSelectionStepProps {
  lineItemId: string;
  Footer: CreateRentalLineItemFooter;
  pimCategoryId: string;
}

const CreateRentalLineItemPricingSelectionStep: React.FC<PricingSelectionStepProps> = ({
  lineItemId,
  Footer,
  pimCategoryId,
}) => {
  const params = useParams();
  const workspace_id = params?.workspace_id as string;
  const [updateLineItem, { loading: mutationLoading }] =
    useUpdateRentalSalesOrderLineCreateDialogMutation();
  const { data, loading, error, refetch } = useGetSalesOrderRentalLineItemByIdCreateDialogQuery({
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
      workspaceId: workspace_id,
      priceType: PriceType.Rental,
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
  const [showAddPriceDialog, setShowAddPriceDialog] = useState(false);
  const [formData, setFormData] = useState({
    priceBookId: "",
    name: "",
    pricePerDayInCents: "",
    pricePerWeekInCents: "",
    pricePerMonthInCents: "",
  });

  const [createRentalPrice, { loading: createPriceLoading }] = useCreateRentalPriceMutation();

  const rentalPrices: PriceOption[] = useMemo(
    () =>
      (pricesData?.listPrices?.items || [])
        ?.map((p) => (p.__typename === "RentalPrice" ? p : null))
        .filter(Boolean)
        .map((p) => ({
          id: p?.id || "",
          name: p?.name || "",
          priceBookName: p?.priceBook?.name || "Custom Prices",
          priceBookId: p?.priceBook?.id || undefined,
          priceBook: p?.priceBook || undefined,
          pricePerDayInCents: p?.pricePerDayInCents,
          pricePerWeekInCents: p?.pricePerWeekInCents,
          pricePerMonthInCents: p?.pricePerMonthInCents,
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
      field: "pricePerDayInCents",
      headerName: "1 Day",
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams) => {
        return params.value != null ? `$${formatCentsToUSD(params.value as number)}` : "-";
      },
    },
    {
      field: "pricePerWeekInCents",
      headerName: "1 Week",
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams) => {
        return params.value != null ? `$${formatCentsToUSD(params.value as number)}` : "-";
      },
    },
    {
      field: "pricePerMonthInCents",
      headerName: "4 Weeks",
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams) => {
        return params.value != null ? `$${formatCentsToUSD(params.value as number)}` : "-";
      },
    },
  ];

  const rowGroupingModel = ["priceBookName"];

  const apiRef = useGridApiRef();

  // Set initial price selection from line item data
  useEffect(() => {
    if (data?.getSalesOrderLineItemById?.__typename === "RentalSalesOrderLineItem") {
      const lineItem = data.getSalesOrderLineItemById;
      if (lineItem.price_id && !selectedPrice) {
        setSelectedPrice(lineItem.price_id);
        setRowSelectionModel({
          ids: new Set([lineItem.price_id]),
          type: "include",
        });

        // // Find and expand the price book containing this price
        const selectedPriceData = rentalPrices.find((p) => p.id === lineItem.price_id);
        if (selectedPriceData && apiRef.current) {
          setTimeout(() => {
            if (apiRef.current) {
              const groupId = `auto-generated-row-priceBookName/${selectedPriceData.priceBookName}`;
              apiRef.current.setRowChildrenExpansion(groupId, true);
            }
          }, 100);
        }
      }
    }
  }, [data, selectedPrice, rentalPrices, apiRef]);

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
        workspaceId: workspace_id,
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
        // Store the price book name to expand
        const priceBookName = formData.priceBookId
          ? priceBooks.find((pb) => pb.id === formData.priceBookId)?.name
          : "Custom Prices";

        // Refetch prices
        await refetchPrices();

        // Select the newly created price
        setRowSelectionModel({
          ids: new Set([result.data.createRentalPrice.id]),
          type: "include",
        });
        setSelectedPrice(result.data.createRentalPrice.id);

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
          pricePerDayInCents: "",
          pricePerWeekInCents: "",
          pricePerMonthInCents: "",
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
              onChange={(e) => setFormData({ ...formData, pricePerWeekInCents: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              type="number"
              inputProps={{ step: "0.01", min: "0" }}
              fullWidth
            />

            <TextField
              label="1 Month Price"
              value={formData.pricePerMonthInCents}
              onChange={(e) => setFormData({ ...formData, pricePerMonthInCents: e.target.value })}
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

export default CreateRentalLineItemPricingSelectionStep;
