"use client";

import { PriceType } from "@/graphql/graphql";
import { useListPricesQuery, type RentalPriceFields } from "@/ui/prices/api";
import { Autocomplete, Box, TextField, Typography } from "@mui/material";
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
    field: "created",
    headerName: "Created",
    width: 260,
    renderCell: (params) => {
      const createdAt = params.row.createdAt ? new Date(params.row.createdAt).toLocaleString() : "";
      return <span>{createdAt}</span>;
    },
  },
  {
    field: "updated",
    headerName: "Updated",
    width: 260,
    renderCell: (params) => {
      const updatedAt = params.row.updatedAt ? new Date(params.row.updatedAt).toLocaleString() : "";
      return <span>{updatedAt}</span>;
    },
  },
];

export function PricesTable() {
  const { price_book_id } = useParams<{ price_book_id: string }>();

  // State for selected category and class
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [selectedClass, setSelectedClass] = React.useState<string | null>(null);

  // Fetch prices (no category filter in query)
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

  // Extract unique categories and classes from prices
  const allCategories = React.useMemo(() => {
    if (!data?.listPrices?.items) return [];
    const rentalPrices = data.listPrices.items.filter((item) => item.__typename === "RentalPrice");
    const unique = Array.from(
      new Set(rentalPrices.map((item) => item.pimCategoryName).filter(Boolean)),
    );
    return unique.sort();
  }, [data]);

  const allClasses = React.useMemo(() => {
    if (!data?.listPrices?.items) return [];
    const rentalPrices = data.listPrices.items.filter((item) => item.__typename === "RentalPrice");
    const unique = Array.from(new Set(rentalPrices.map((item) => item.name).filter(Boolean)));
    return unique.sort();
  }, [data]);

  // Filter rows by selected category and class
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
    let rentalRows = data.listPrices.items.filter((item) => item.__typename === "RentalPrice");
    if (selectedCategory) {
      rentalRows = rentalRows.filter((item) => item.pimCategoryName === selectedCategory);
    }
    if (selectedClass) {
      rentalRows = rentalRows.filter((item) => item.name === selectedClass);
    }
    return rentalRows;
  }, [data, loading, error, selectedCategory, selectedClass]);

  return (
    <Box>
      {/* Filters */}
      <Box mb={2} display="flex" gap={2} flexWrap="wrap">
        <Autocomplete
          options={allCategories}
          value={selectedCategory}
          onChange={(_, newValue) => setSelectedCategory(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filter by Category"
              variant="outlined"
              placeholder="Type to search"
            />
          )}
          clearOnEscape
          isOptionEqualToValue={(option, value) => option === value}
          sx={{ minWidth: 220 }}
        />
        <Autocomplete
          options={allClasses}
          value={selectedClass}
          onChange={(_, newValue) => setSelectedClass(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filter by Class"
              variant="outlined"
              placeholder="Type to search"
            />
          )}
          clearOnEscape
          isOptionEqualToValue={(option, value) => option === value}
          sx={{ minWidth: 220 }}
        />
      </Box>
      {loading && <Typography>Loading prices...</Typography>}
      {error && <Typography color="error">Error: {error.message}</Typography>}
      <div style={{ height: 600, width: "100%" }}>
        <DataGridPro rows={rows} columns={columns} />
      </div>
    </Box>
  );
}
