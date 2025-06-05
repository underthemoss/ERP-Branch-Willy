"use client";

import { PriceType } from "@/graphql/graphql";
import type { ListPriceBookCategoriesQuery } from "@/graphql/graphql";
import { useListPriceBookCategoriesQuery } from "@/graphql/hooks";
import {
  useListPriceNamesQuery,
  useListPricesQuery,
  type RentalPriceFields,
} from "@/ui/prices/api";
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { DataGridPro, DataGridProProps, GridColDef } from "@mui/x-data-grid-pro";
import { useParams } from "next/navigation";
import * as React from "react";
import { PimCategoriesTreeView } from "../pim/PimCategoriesTreeView";
import { AddNewPriceDialog } from "./AddNewPriceDialog";

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

  // Fetch categories for dropdown
  const {
    data: categoriesData,
    loading: categoriesLoading,
    error: categoriesError,
  } = useListPriceBookCategoriesQuery({
    variables: { priceBookId: price_book_id },
  });

  // Fetch prices, filter by selected category (server-side)
  const { data, loading, error } = useListPricesQuery({
    variables: {
      filter: {
        priceBookId: price_book_id,
        priceType: PriceType.Rental,
        ...(selectedCategory ? { pimCategoryId: selectedCategory } : {}),
      },
      page: {
        size: 100,
      },
    },
  });

  // Use fetched categories for dropdown
  const allCategories = React.useMemo(() => {
    if (!categoriesData?.listPriceBookCategories) return [];
    return (
      categoriesData.listPriceBookCategories as ListPriceBookCategoriesQuery["listPriceBookCategories"]
    ).map((cat: { id: string; name: string }) => ({
      id: cat.id,
      name: cat.name,
    }));
  }, [categoriesData]);

  // Fetch class names for dropdown, only when a category is selected
  const {
    data: classNamesData,
    loading: classNamesLoading,
    error: classNamesError,
  } = useListPriceNamesQuery({
    variables: {
      priceBookId: price_book_id,
      pimCategoryId: selectedCategory,
    },
  });

  const allClasses = React.useMemo(() => {
    if (!classNamesData?.listPriceNames) return [];
    return classNamesData.listPriceNames.filter(Boolean).sort();
  }, [classNamesData]);

  // Filter rows by selected class (category is now server-side)
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
    let rentalRows = data.listPrices.items.filter(
      (item) => item.__typename === "RentalPrice",
    ) as RentalPriceFields[];
    if (selectedClass) {
      rentalRows = rentalRows.filter((item) => item.name === selectedClass);
    }
    return rentalRows;
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
          loading={categoriesLoading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filter by Category"
              variant="outlined"
              placeholder="Type to search"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {categoriesLoading ? <span style={{ marginRight: 8 }}>Loading...</span> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              error={!!categoriesError}
              helperText={categoriesError ? "Failed to load categories" : ""}
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
          loading={classNamesLoading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filter by Class"
              variant="outlined"
              placeholder="Type to search"
              error={!!classNamesError}
              helperText={classNamesError ? "Failed to load classes" : ""}
            />
          )}
          clearOnEscape
          isOptionEqualToValue={(option, value) => option === value}
          sx={{ minWidth: 220 }}
        />
      </Box>
      {/* Add Price Dialog */}
      <AddNewPriceDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        priceBookId={price_book_id}
        onSuccess={() => setAddDialogOpen(false)}
      />
      {loading && <Typography>Loading prices...</Typography>}
      {error && <Typography color="error">Error: {error.message}</Typography>}
      <div style={{ height: 600, width: "100%" }}>
        <DataGridPro rows={rows} columns={columns} />
      </div>
    </Box>
  );
}
