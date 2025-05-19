"use client";

import { graphql } from "@/graphql";
import { useListAssetsLazyQuery } from "@/graphql/hooks";
import ClearIcon from "@mui/icons-material/Clear";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import SearchIcon from "@mui/icons-material/Search";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { DataGridPro, GridColDef, GridRowScrollEndParams } from "@mui/x-data-grid-pro";
import { PageContainer } from "@toolpad/core/PageContainer";
import * as React from "react";
import { useState } from "react";

const statuses = [
  "Available",
  "Assigned",
  "Ready to Rent",
  "Hard Down",
  "Soft Down",
  "Needs Inspection",
  "Hard Reservation",
  "Soft Reservation",
  "Make Ready",
  "Pending Return",
];
graphql(`
  query ListAssets($page: ListAssetsPage) {
    listAssets(page: $page) {
      items {
        id
        photo_id
        name
        custom_name
        description
        pim_category_name
        pim_make
        pim_product_name
        pim_product_model
        pim_product_year
      }
      page {
        number
        size
        totalItems
        totalPages
      }
    }
  }
`);

export default function Inventory() {
  const pageSize = 200_000;
  const [rows, setRows] = React.useState<any[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [loadAssets, { data, loading, previousData }] = useListAssetsLazyQuery({
    fetchPolicy: "network-only",
  });
  const [activeFilters, setActiveFilters] = useState(["Available", "Serialized Assets"]);
  const [selectedStatus, setSelectedStatus] = useState("Available");

  React.useEffect(() => {
    setRows([]);
    setPage(1);
    loadAssets({ variables: { page: { number: 1, size: pageSize } } });
  }, [loadAssets, pageSize]);

  React.useEffect(() => {
    if (!data) {
      return;
    }
    const items = data.listAssets?.items || [];
    setRows((prev) => [
      ...prev,
      ...items.map((item) => ({
        id: item.id ?? "",
        photo_id: item.photo_id ?? "",
        name: item.name,
        custom_name: item.custom_name,
        description: item.description,
        pim_category_name: item.pim_category_name,
        pim_make: item.pim_make,
        pim_product_name: item.pim_product_name,
        pim_product_model: item.pim_product_model,
        pim_product_year: item.pim_product_year,
      })),
    ]);
    setTotalItems(data.listAssets?.page.totalItems || 0);
    setPage((data.listAssets?.page.number || 0) + 1);
  }, [data]);

  const columns: GridColDef[] = [
    {
      field: "photo_id",
      headerName: "",
      width: 60,
      renderCell: (params) => {
        if (!params.value) return <></>;
        return <Avatar sx={{ width: 32, height: 32, marginTop: 1 }}>{params.value}</Avatar>;
      },
      sortable: false,
      filterable: false,
    },
    { field: "id", headerName: "ID", width: 100 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "custom_name", headerName: "Custom Name", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    { field: "pim_category_name", headerName: "Category", flex: 1 },
    { field: "pim_make", headerName: "Make", flex: 1 },
    { field: "pim_product_name", headerName: "Product Name", flex: 1 },
    { field: "pim_product_model", headerName: "Model", flex: 1 },
    { field: "pim_product_year", headerName: "Year", width: 120 },
  ];

  return (
    <PageContainer>
      <Container maxWidth="lg">
        <Typography variant="h1" mt={4} mb={1}>
          Inventory Management
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={2}>
          Track, assign, and manage inventory resources across your operations.
        </Typography>

        {/* Search & Filter Row */}
        <Box display="flex" gap={2} alignItems="center" mb={2}>
          <TextField
            placeholder="Search product by name"
            variant="outlined"
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <Select size="small" value="All Statuses" displayEmpty>
            <MenuItem value="All Statuses">All Statuses</MenuItem>
            {/* Add other options as needed */}
          </Select>

          <Select size="small" value="All Resource Tags" displayEmpty>
            <MenuItem value="All Resource Tags">All Resource Tags</MenuItem>
          </Select>

          <Select size="small" value="All Inventory" displayEmpty>
            <MenuItem value="All Inventory">All Inventory</MenuItem>
          </Select>

          <IconButton>
            <FilterAltOutlinedIcon />
          </IconButton>
        </Box>

        {/* Active Filters */}
        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
          {activeFilters.map((filter, idx) => (
            <Chip
              key={idx}
              label={filter}
              onDelete={() => {
                setActiveFilters((prev) => prev.filter((f) => f !== filter));
              }}
              deleteIcon={<ClearIcon />}
            />
          ))}
        </Box>

        <Box mt={5}>
          {statuses.map((status, i) => {
            const isSelected = activeFilters.includes(status);

            return (
              <Box mr={1} mb={1} key={status} display={"inline-block"}>
                <Chip
                  onClick={() => setActiveFilters([...new Set([...activeFilters, status])])}
                  label={
                    <Box display={"flex"} alignItems={"center"}>
                      {status}
                    </Box>
                  }
                  onDelete={() => {
                    setActiveFilters((prev) => prev.filter((f) => f !== status));
                  }}
                  deleteIcon={isSelected ? undefined : <Typography></Typography>}
                  size="medium"
                  color={isSelected ? "primary" : "default"}
                  variant={isSelected ? "outlined" : "filled"}
                  clickable
                />
              </Box>
            );
          })}
        </Box>
      </Container>
      <Container maxWidth="lg">
        <Box sx={{ height: 600 }}>
          <DataGridPro
            columns={columns}
            rows={rows}
            loading={loading}
            pagination
            paginationMode="server"
            rowCount={totalItems}
            getDetailPanelContent={({ row }) => <div>Asset ID: {row.id}</div>}
            getDetailPanelHeight={({ row }) => "auto"}
            initialState={{
              pagination: { paginationModel: { pageSize } },
            }}
            hideFooter
            onRowsScrollEnd={(params: GridRowScrollEndParams) => {
              if (!loading && rows.length < totalItems) {
                loadAssets({
                  variables: { page: { number: page, size: pageSize } },
                });
              }
            }}
          />
        </Box>
      </Container>
    </PageContainer>
  );
}
