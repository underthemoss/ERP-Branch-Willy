"use client";

import {
  PriceType,
  useGetSalesOrderRentalLineItemByIdCreateDialogQuery,
  useUpdateRentalSalesOrderLineCreateDialogMutation,
} from "@/graphql/hooks";
import { useGetPimCategoryByIdQuery } from "@/ui/pim/api";
import { useListPricesQuery } from "@/ui/prices/api";
import {
  Box,
  DialogContent,
  DialogTitle,
  InputAdornment,
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
import React, { useMemo, useState } from "react";
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

  const { data: pricesData, loading: pricesLoading } = useListPricesQuery({
    variables: {
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

  const rentalPrices: PriceOption[] = useMemo(
    () =>
      (pricesData?.listPrices?.items || [])
        ?.map((p) => (p.__typename === "RentalPrice" ? p : null))
        .filter(Boolean)
        .map((p) => ({
          id: p?.id || "",
          name: p?.name || "",
          priceBookName: p?.priceBook?.name || "Not in price book",
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

  const initialState = useKeepGroupedColumnsHidden({
    apiRef,
    initialState: {
      rowGrouping: {
        model: rowGroupingModel,
      },
    },
  });

  return (
    <>
      <DialogTitle>
        <Typography variant="caption">{pimCategoryData?.getPimCategoryById?.path}</Typography>
        <br />
        Select pricing: {pimCategoryData?.getPimCategoryById?.name}
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
    </>
  );
};

export default CreateRentalLineItemPricingSelectionStep;
