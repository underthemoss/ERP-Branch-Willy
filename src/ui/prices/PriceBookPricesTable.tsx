"use client";

import { PriceType } from "@/graphql/graphql";
import { useListPricesQuery, type RentalPriceFields, type SalePriceFields } from "@/ui/prices/api";
import { Autocomplete, Box, Button, TextField, Typography } from "@mui/material";
import { DataGridPro, GridColDef } from "@mui/x-data-grid-pro";
import { useParams } from "next/navigation";
import * as React from "react";
import { AddNewPriceDialog } from "./AddNewPriceDialog";

function formatCentsToUSD(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

const columns: GridColDef[] = [
  { field: "pimCategoryName", headerName: "Category", width: 230 },
  {
    field: "name",
    headerName: "Class",
    width: 230,
    renderCell: ({ row }) => {
      return row.name || <span>&mdash;</span>;
    },
  },
  // Rental columns
  {
    field: "pricePerDayInCents",
    headerName: "Day",
    type: "number",
    renderCell: (params) => {
      const { row } = params;
      if (row.__typename === "RentalPrice" && row.pricePerDayInCents != null) {
        return formatCentsToUSD(row.pricePerDayInCents);
      }
      return <span>&mdash;</span>;
    },
  },
  {
    field: "pricePerWeekInCents",
    headerName: "Week",
    type: "number",
    renderCell: (params) => {
      const { row } = params;
      if (row.__typename === "RentalPrice" && row.pricePerWeekInCents != null) {
        return formatCentsToUSD(row.pricePerWeekInCents);
      }
      return <span>&mdash;</span>;
    },
  },
  {
    field: "pricePerMonthInCents",
    headerName: "4-Week",
    type: "number",
    renderCell: (params) => {
      const { row } = params;
      if (row.__typename === "RentalPrice" && row.pricePerMonthInCents != null) {
        return formatCentsToUSD(row.pricePerMonthInCents);
      }
      return <span>&mdash;</span>;
    },
  },
  // Sale column
  {
    field: "unitCostInCents",
    headerName: "Unit Cost",
    type: "number",
    renderCell: (params) => {
      const { row } = params;
      if (row.__typename === "SalePrice" && row.unitCostInCents != null) {
        return formatCentsToUSD(row.unitCostInCents);
      }
      return <span>&mdash;</span>;
    },
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
  const [selectedPriceTypes, setSelectedPriceTypes] = React.useState<PriceType[]>([]);

  const priceTypeOptions = [
    { label: "Rental", value: PriceType.Rental },
    { label: "Sale", value: PriceType.Sale },
  ];

  // Fetch prices, filter by selected category and price type (server-side)
  const { data, loading, error } = useListPricesQuery({
    variables: {
      priceBookId: price_book_id,
      ...(selectedClass ? { name: selectedClass } : {}),
      ...(selectedCategory ? { pimCategoryId: selectedCategory } : {}),
      ...(selectedPriceTypes.length === 1 ? { priceType: selectedPriceTypes[0] } : {}),
      shouldListPriceBooks: false, // We don't need price books here
      page: {
        size: 100,
      },
    },
  });

  // Use fetched categories for dropdown
  const allCategories = React.useMemo(() => {
    if (!data?.listPriceBookCategories) return [];
    return data.listPriceBookCategories.map((cat: { id: string; name: string }) => ({
      id: cat.id,
      name: cat.name,
    }));
  }, [data]);

  const allClasses = React.useMemo(() => {
    if (!data?.listPriceNames) return [];
    return data.listPriceNames.filter(Boolean).sort();
  }, [data]);

  // Filter rows by selected class (category is now server-side)
  const rows = React.useMemo<(RentalPriceFields | SalePriceFields)[]>(() => {
    if (loading) return [];
    if (error) {
      console.error("Error loading prices:", error);
      return [];
    }
    if (!data || !data.listPrices || !data.listPrices.items) {
      console.warn("No prices found or data is undefined");
      return [];
    }
    // Include both RentalPrice and SalePrice
    let allRows = data.listPrices.items.filter(
      (item) => item.__typename === "RentalPrice" || item.__typename === "SalePrice",
    ) as (RentalPriceFields | SalePriceFields)[];
    if (selectedClass) {
      allRows = allRows.filter((item) => item.name === selectedClass);
    }
    return allRows;
  }, [data, loading, error, selectedClass]);

  // State for Add Price dialog
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);

  return (
    <Box>
      {/* Add Price Button and Filters - aligned in a single row */}
      <Box mb={2} display="flex" alignItems="center" gap={2} flexWrap="wrap">
        <Button
          variant="contained"
          color="primary"
          onClick={() => setAddDialogOpen(true)}
          sx={{ height: 40 }}
        >
          Add Price
        </Button>
        <Autocomplete
          options={allCategories}
          getOptionLabel={(option) => (typeof option === "string" ? option : option.name)}
          value={allCategories.find((cat) => cat.id === selectedCategory) || null}
          onChange={(_, newValue) => {
            setSelectedCategory(newValue ? newValue.id : null);
          }}
          loading={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filter by Category"
              variant="outlined"
              placeholder="Type to search"
              error={!!error}
              helperText={error ? "Failed to load categories" : ""}
            />
          )}
          clearOnEscape
          isOptionEqualToValue={(option, value) =>
            (typeof option === "string" ? option : option.id) ===
            (typeof value === "string" ? value : value?.id)
          }
          sx={{ minWidth: 220 }}
        />
        <Autocomplete
          options={allClasses}
          value={selectedClass}
          onChange={(_, newValue) => setSelectedClass(newValue)}
          loading={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filter by Class"
              variant="outlined"
              placeholder="Type to search"
              error={!!error}
              helperText={error ? "Failed to load classes" : ""}
            />
          )}
          clearOnEscape
          isOptionEqualToValue={(option, value) => option === value}
          sx={{ minWidth: 220 }}
        />
        <Autocomplete
          multiple
          options={priceTypeOptions}
          getOptionLabel={(option) => option.label}
          value={priceTypeOptions.filter((opt) => selectedPriceTypes.includes(opt.value))}
          onChange={(_, newValue) => {
            setSelectedPriceTypes(newValue.map((opt) => opt.value));
          }}
          renderInput={(params) => (
            <TextField {...params} label="Filter by type" variant="outlined" />
          )}
          disableCloseOnSelect
          sx={{ minWidth: 180 }}
        />
      </Box>
      {/* Add Price Dialog */}
      <AddNewPriceDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        priceBookId={price_book_id}
        onSuccess={() => setAddDialogOpen(false)}
      />
      {/* {loading && <Typography>Loading prices...</Typography>} */}
      {error && <Typography color="error">Error: {error.message}</Typography>}
      <div style={{ height: 600, width: "100%" }}>
        <DataGridPro rows={rows} columns={columns} loading={loading} />
      </div>
    </Box>
  );
}
