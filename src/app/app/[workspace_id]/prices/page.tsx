"use client";

import { PriceType } from "@/graphql/graphql";
import { useListPricesQuery } from "@/ui/prices/api";
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
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
  GridRowGroupingModel,
  useGridApiRef,
  useKeepGroupedColumnsHidden,
} from "@mui/x-data-grid-premium";
import { PageContainer } from "@toolpad/core/PageContainer";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";

export default function AllPrices() {
  const apiRef = useGridApiRef();
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const [selectedPriceBook, setSelectedPriceBook] = React.useState<string>("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("");
  const [selectedClass, setSelectedClass] = React.useState<string>("");
  const [selectedPriceTypes, setSelectedPriceTypes] = React.useState<PriceType[]>([]);

  const priceTypeOptions = [
    { label: "Rental", value: PriceType.Rental },
    { label: "Sale", value: PriceType.Sale },
  ];

  // Fetch all prices, filtered by selected PIM category, class, and price type if set
  const { data, loading, error } = useListPricesQuery({
    variables: {
      ...(selectedPriceBook ? { priceBookId: selectedPriceBook } : {}),
      ...(selectedCategory ? { pimCategoryId: selectedCategory } : {}),
      ...(selectedClass ? { name: selectedClass } : {}),
      ...(selectedPriceTypes.length === 1 ? { priceType: selectedPriceTypes[0] } : {}),
      shouldListPriceBooks: true,
      page: { number: 1, size: 1000 },
    },
    fetchPolicy: "cache-and-network",
  });

  // Transform data to grid rows
  const rows = React.useMemo(() => {
    if (!data?.listPrices?.items) return [];
    return data.listPrices.items.map((item: any) => {
      return {
        id: item.id,
        type: item.__typename,
        name: item.name,
        pimCategoryId: item.pimCategoryId,
        pimCategoryName: item.pimCategoryName,
        priceBookId: item.priceBook?.id || "",
        priceBookName: item.priceBook?.name || "",
        pricePerDayInCents: item.pricePerDayInCents,
        pricePerWeekInCents: item.pricePerWeekInCents,
        pricePerMonthInCents: item.pricePerMonthInCents,
        unitCostInCents: item.unitCostInCents,
        priceType: item.priceType,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });
  }, [data]);

  // Define columns
  const columns: GridColDef[] = [
    { field: "pimCategoryName", headerName: "PIM Category", width: 200 },
    { field: "name", headerName: "Name", width: 200 },
    {
      field: "priceBookName",
      headerName: "Price Book",
      width: 200,
      renderCell: (params) => {
        const priceBookId = params.row.priceBookId;
        const priceBookName = params.value || "Not in Price Book";
        // Use workspace_id in the route
        return priceBookId ? (
          <Box display="flex" alignItems="center" height="100%">
            <Link href={`/app/${workspace_id}/prices/price-books/${priceBookId}`}>
              <Typography color="primary" sx={{ textDecoration: "underline" }}>
                {priceBookName}
              </Typography>
            </Link>
          </Box>
        ) : (
          priceBookName
        );
      },
    },
    {
      field: "pricePerDayInCents",
      headerName: "1 Day",
      width: 120,
      valueFormatter: (value: number) => (value != null ? `$${(value / 100).toFixed(2)}` : ""),
    },
    {
      field: "pricePerWeekInCents",
      headerName: "1 Week",
      width: 120,
      valueFormatter: (value: number) => (value != null ? `$${(value / 100).toFixed(2)}` : ""),
    },
    {
      field: "pricePerMonthInCents",
      headerName: "4 Weeks",
      width: 120,
      valueFormatter: (value: number) => (value != null ? `$${(value / 100).toFixed(2)}` : ""),
    },
    {
      field: "unitCostInCents",
      headerName: "Unit Cost",
      width: 120,
      valueFormatter: (value: number) => (value != null ? `$${(value / 100).toFixed(2)}` : ""),
    },
    {
      field: "createdAt",
      headerName: "Created At",
      width: 180,
      valueFormatter: (value: string) => (value ? new Date(value).toLocaleString() : ""),
    },
    {
      field: "updatedAt",
      headerName: "Updated At",
      width: 180,
      valueFormatter: (value: string) => (value ? new Date(value).toLocaleString() : ""),
    },
  ];

  // Row grouping model: group by PIM Category, then Name, then Price Book (by id)
  const rowGroupingModel: GridRowGroupingModel = ["pimCategoryName", "priceBookName"];

  // State for grouping expansion depth
  const [defaultGroupingExpansionDepth, setDefaultGroupingExpansionDepth] =
    React.useState<number>(0);

  const initialState = useKeepGroupedColumnsHidden({
    apiRef,
    initialState: {
      rowGrouping: {
        model: rowGroupingModel,
      },
    },
  });

  return (
    <PageContainer>
      <Stack spacing={2}>
        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={() => setDefaultGroupingExpansionDepth(-1)}>
            Expand All
          </Button>
          <Button variant="outlined" onClick={() => setDefaultGroupingExpansionDepth(0)}>
            Collapse All
          </Button>
        </Box>
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <FormControl sx={{ minWidth: 240 }}>
            <InputLabel id="price-book-label">Price Book</InputLabel>
            <Select
              labelId="price-book-label"
              value={selectedPriceBook}
              label="Price Book"
              onChange={(e) => {
                setSelectedPriceBook(e.target.value);
                setSelectedCategory("");
                setSelectedClass("");
              }}
              disabled={loading}
            >
              <MenuItem value="">
                <em>All Price Books</em>
              </MenuItem>
              {data?.listPriceBooks?.items?.map((book: any) => (
                <MenuItem key={book.id} value={book.id}>
                  {book.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 240 }}>
            <InputLabel id="pim-category-label">PIM Category</InputLabel>
            <Select
              labelId="pim-category-label"
              value={selectedCategory}
              label="PIM Category"
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedClass(""); // Reset class when category changes
              }}
              disabled={loading}
            >
              <MenuItem value="">
                <em>All Categories</em>
              </MenuItem>
              {data?.listPriceBookCategories?.map((cat: any) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 240 }}>
            <InputLabel id="class-label">Class</InputLabel>
            <Select
              labelId="class-label"
              value={selectedClass}
              label="Class"
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="">
                <em>All Classes</em>
              </MenuItem>
              {data?.listPriceNames?.map((className: string) => (
                <MenuItem key={className} value={className}>
                  {className}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
        {error && (
          <Box>
            <Typography color="error">{error.message}</Typography>
          </Box>
        )}
        <Box sx={{ height: 700, width: "100%" }}>
          <DataGridPremium
            apiRef={apiRef}
            rows={rows}
            columns={columns}
            loading={loading}
            rowGroupingModel={rowGroupingModel}
            disableRowSelectionOnClick
            getRowId={(row) => row.id}
            defaultGroupingExpansionDepth={defaultGroupingExpansionDepth}
            initialState={initialState}
            groupingColDef={{
              headerName: "Category / Price Book",
            }}
          />
        </Box>
      </Stack>
    </PageContainer>
  );
}
