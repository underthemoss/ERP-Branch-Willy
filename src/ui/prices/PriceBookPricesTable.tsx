"use client";

import { PriceType } from "@/graphql/graphql";
import {
  useDeletePriceByIdMutation,
  useListPricesQuery,
  type RentalPriceFields,
  type SalePriceFields,
} from "@/ui/prices/api";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { DataGridPro, GridColDef } from "@mui/x-data-grid-pro";
import { useParams } from "next/navigation";
import * as React from "react";
import { AddNewPriceDialog } from "./AddNewPriceDialog";
import { EditRentalPriceDialog } from "./EditRentalPriceDialog";
import { EditSalePriceDialog } from "./EditSalePriceDialog";

function formatCentsToUSD(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

const createColumns = (
  handleEditPrice: (price: RentalPriceFields | SalePriceFields) => void,
  handleDeletePrice: (price: RentalPriceFields | SalePriceFields) => void,
): GridColDef[] => [
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
  {
    field: "actions",
    headerName: "Actions",
    width: 120,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <Box display="flex" gap={0.5}>
        <IconButton
          onClick={() => handleEditPrice(params.row)}
          size="small"
          aria-label="edit price"
        >
          <EditIcon />
        </IconButton>
        <IconButton
          onClick={() => handleDeletePrice(params.row)}
          size="small"
          aria-label="delete price"
          color="error"
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    ),
  },
];

export function PricesTable() {
  const { price_book_id } = useParams<{ price_book_id: string }>();

  // State for selected category and class
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [selectedClass, setSelectedClass] = React.useState<string | null>(null);
  const [selectedPriceTypes, setSelectedPriceTypes] = React.useState<PriceType[]>([]);

  // State for edit dialogs
  const [editingRentalPrice, setEditingRentalPrice] = React.useState<RentalPriceFields | null>(
    null,
  );
  const [editingSalePrice, setEditingSalePrice] = React.useState<SalePriceFields | null>(null);

  // State for delete confirmation
  const [priceToDelete, setPriceToDelete] = React.useState<
    (RentalPriceFields | SalePriceFields) | null
  >(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  // Delete mutation
  const [deletePrice] = useDeletePriceByIdMutation();

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

  // Handle edit price
  const handleEditPrice = (price: RentalPriceFields | SalePriceFields) => {
    if (price.__typename === "RentalPrice") {
      setEditingRentalPrice(price as RentalPriceFields);
    } else if (price.__typename === "SalePrice") {
      setEditingSalePrice(price as SalePriceFields);
    }
  };

  // Handle delete price
  const handleDeletePrice = (price: RentalPriceFields | SalePriceFields) => {
    setPriceToDelete(price);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!priceToDelete) return;

    try {
      await deletePrice({
        variables: {
          id: priceToDelete.id,
        },
      });
      setDeleteDialogOpen(false);
      setPriceToDelete(null);
    } catch (error) {
      console.error("Error deleting price:", error);
    }
  };

  // Create columns with the edit and delete handlers
  const columns = React.useMemo(() => createColumns(handleEditPrice, handleDeletePrice), []);

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
        <DataGridPro
          rows={rows}
          columns={columns}
          loading={loading}
          pinnedColumns={{ right: ["actions"] }}
        />
      </div>

      {/* Edit Rental Price Dialog */}
      {editingRentalPrice && (
        <EditRentalPriceDialog
          open={!!editingRentalPrice}
          onClose={() => setEditingRentalPrice(null)}
          price={editingRentalPrice}
          onSuccess={() => setEditingRentalPrice(null)}
        />
      )}

      {/* Edit Sale Price Dialog */}
      {editingSalePrice && (
        <EditSalePriceDialog
          open={!!editingSalePrice}
          onClose={() => setEditingSalePrice(null)}
          price={editingSalePrice}
          onSuccess={() => setEditingSalePrice(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this price? This action cannot be undone.
            {priceToDelete && (
              <Box mt={2}>
                <Typography variant="body2">
                  <strong>Category:</strong> {priceToDelete.pimCategoryName}
                </Typography>
                {priceToDelete.name && (
                  <Typography variant="body2">
                    <strong>Class:</strong> {priceToDelete.name}
                  </Typography>
                )}
                {priceToDelete.__typename === "RentalPrice" && (
                  <Typography variant="body2">
                    <strong>Type:</strong> Rental
                  </Typography>
                )}
                {priceToDelete.__typename === "SalePrice" && (
                  <Typography variant="body2">
                    <strong>Type:</strong> Sale
                  </Typography>
                )}
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
