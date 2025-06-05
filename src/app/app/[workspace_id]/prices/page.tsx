"use client";

import { useListPriceBookCategoriesQuery } from "@/graphql/hooks";
import {
  useListPriceBooksQuery,
  useListPriceNamesQuery,
  useListPricesQuery,
} from "@/ui/prices/api";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import {
  DataGridPremium,
  GridColDef,
  GridRowGroupingModel,
  useGridApiRef,
} from "@mui/x-data-grid-premium";
import { PageContainer } from "@toolpad/core/PageContainer";
import Link from "next/link";
import * as React from "react";

export default function AllPrices() {
  const apiRef = useGridApiRef();
  const [selectedPriceBook, setSelectedPriceBook] = React.useState<string>("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("");
  const [selectedClass, setSelectedClass] = React.useState<string>("");

  // Fetch all price books
  const { data: priceBooksData, loading: priceBooksLoading } = useListPriceBooksQuery({
    variables: { page: { number: 1, size: 100 } },
  });

  // Fetch all PIM categories, filtered by selected price book if set
  const { data: categoriesData, loading: categoriesLoading } = useListPriceBookCategoriesQuery({
    variables: { priceBookId: selectedPriceBook || undefined },
  });

  // Fetch all price names (classes), filtered by selected price book and PIM category if set
  const { data: classNamesData, loading: classNamesLoading } = useListPriceNamesQuery({
    variables: {
      priceBookId: selectedPriceBook || undefined,
      pimCategoryId: selectedCategory || undefined,
    },
  });

  // Fetch all prices, filtered by selected PIM category and class if set
  const { data, loading, error } = useListPricesQuery({
    variables: {
      filter: {
        ...(selectedPriceBook ? { priceBookId: selectedPriceBook } : {}),
        ...(selectedCategory ? { pimCategoryId: selectedCategory } : {}),
        ...(selectedClass ? { name: selectedClass } : {}),
      },
      page: { number: 1, size: 1000 },
    },
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
        const priceBookName = params.value;
        // Assuming workspace_id is available in the route, use a relative path
        return priceBookId ? (
          <Link href={`/prices/price-books/${priceBookId}`} passHref legacyBehavior>
            <a style={{ color: "#1976d2", textDecoration: "underline" }}>{priceBookName}</a>
          </Link>
        ) : (
          priceBookName
        );
      },
    },
    { field: "type", headerName: "Type", width: 120 },
    { field: "priceType", headerName: "Price Type", width: 120 },
    {
      field: "pricePerDayInCents",
      headerName: "Price/Day",
      width: 120,
      valueFormatter: (value: number) => (value != null ? `$${(value / 100).toFixed(2)}` : ""),
    },
    {
      field: "pricePerWeekInCents",
      headerName: "Price/Week",
      width: 120,
      valueFormatter: (value: number) => (value != null ? `$${(value / 100).toFixed(2)}` : ""),
    },
    {
      field: "pricePerMonthInCents",
      headerName: "Price/Month",
      width: 120,
      valueFormatter: (value: number) => (value != null ? `$${(value / 100).toFixed(2)}` : ""),
    },
    {
      field: "unitCostInCents",
      headerName: "Unit Cost",
      width: 120,
      valueFormatter: (value: number) => (value != null ? `$${(value / 100).toFixed(2)}` : ""),
    },
    { field: "createdAt", headerName: "Created At", width: 180 },
    { field: "updatedAt", headerName: "Updated At", width: 180 },
  ];

  // Row grouping model: group by PIM Category, then Name, then Price Book (by id)
  const rowGroupingModel: GridRowGroupingModel = ["pimCategoryName", "name", "priceBookId"];

  // State for grouping expansion depth
  const [defaultGroupingExpansionDepth, setDefaultGroupingExpansionDepth] =
    React.useState<number>(0);

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
        <Box display="flex" alignItems="center" gap={2}>
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
              disabled={priceBooksLoading}
            >
              <MenuItem value="">
                <em>All Price Books</em>
              </MenuItem>
              {priceBooksData?.listPriceBooks?.items?.map((book: any) => (
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
              disabled={categoriesLoading}
            >
              <MenuItem value="">
                <em>All Categories</em>
              </MenuItem>
              {categoriesData?.listPriceBookCategories?.map((cat: any) => (
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
              disabled={classNamesLoading}
            >
              <MenuItem value="">
                <em>All Classes</em>
              </MenuItem>
              {classNamesData?.listPriceNames?.map((className: string) => (
                <MenuItem key={className} value={className}>
                  {className}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
          />
        </Box>
      </Stack>
    </PageContainer>
  );
}
