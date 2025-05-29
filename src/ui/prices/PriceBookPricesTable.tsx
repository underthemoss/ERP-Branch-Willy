"use client";

import { PriceType } from "@/graphql/graphql";
import { useListPricesQuery, type RentalPriceFields } from "@/ui/prices/api";
import { Box, Typography } from "@mui/material";
import { DataGridPro, DataGridProProps, GridColDef } from "@mui/x-data-grid-pro";
import { useParams } from "next/navigation";
import * as React from "react";

function formatCentsToUSD(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

const columns: GridColDef<RentalPriceFields>[] = [
  { field: "pimCategoryName", headerName: "Category", width: 230 },
  {
    field: "name",
    headerName: "Class",
    width: 230,
  },
  {
    field: "pricePerDayInCents",
    headerName: "Day",
    type: "number",
    valueGetter: formatCentsToUSD,
  },
  {
    field: "pricePerWeekInCents",
    headerName: "Week",
    type: "number",
    valueGetter: formatCentsToUSD,
  },
  {
    field: "pricePerMonthInCents",
    headerName: "4-Week",
    type: "number",
    valueGetter: formatCentsToUSD,
  },
  {
    field: "createdAt",
    headerName: "Created At",
    type: "dateTime",
    width: 180,
    valueGetter: (value) => new Date(value),
  },
  {
    field: "updatedAt",
    headerName: "Updated At",
    type: "dateTime",
    width: 180,
    valueGetter: (value) => new Date(value),
  },
];

export function PricesTable() {
  const { price_book_id } = useParams<{ price_book_id: string }>();
  const { data, loading, error } = useListPricesQuery({
    variables: {
      filter: {
        priceBookId: price_book_id,
        priceType: PriceType.Rental,
      },
      page: {
        size: 100,
      },
    },
  });

  const rows = React.useMemo<RentalPriceFields[]>(() => {
    if (loading) return [];
    if (error) {
      console.error("Error loading prices:", error);
      return [];
    }

    if (!data || !data.listPrices || !data.listPrices.items) {
      console.warn("No prices found or data is undefined");
      return [];
    }

    return (
      // just rental prices for now..
      data.listPrices.items.filter((item) => item.__typename === "RentalPrice")
    );
  }, [data, loading, error]);

  return (
    <Box>
      {loading && <Typography>Loading prices...</Typography>}
      {error && <Typography color="error">Error: {error.message}</Typography>}
      <div style={{ height: 600, width: "100%" }}>
        <DataGridPro rows={rows} columns={columns} />
      </div>
    </Box>
  );
}
