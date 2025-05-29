"use client";

import { graphql } from "@/graphql";
import { useListAssetsQuery } from "@/graphql/hooks";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ClearIcon from "@mui/icons-material/Clear";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { DataGridPremium, GridColDef, GridRowScrollEndParams } from "@mui/x-data-grid-premium";
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
        photo {
          filename
        }
        company {
          name
        }
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
  const [searchTerm, setSearchTerm] = React.useState("");
  const { data, loading } = useListAssetsQuery({
    variables: { page: { number: 1, size: pageSize } },
    fetchPolicy: "cache-and-network",
  });
  const [activeFilters, setActiveFilters] = useState(["Available"]);

  const rows = React.useMemo(() => {
    const items = data?.listAssets?.items || [];
    return items.map((item) => ({
      id: item.id ?? "",
      photo_id: item.photo_id ?? "",
      // Use the production CDN for asset photos to prevent broken image links in non-prod environments,
      // as lower environments may have incomplete or missing photo data. This is a temporary workaround
      // until data hygiene is improved across all environments.
      photo: item.photo?.filename
        ? `https://appcdn.equipmentshare.com/uploads/small/${item.photo.filename}`
        : "",
      photo_large: item.photo?.filename
        ? `https://appcdn.equipmentshare.com/uploads/${item.photo.filename}`
        : "",
      name: item.name,
      company: item.company?.name ?? "",
      custom_name: item.custom_name,
      description: item.description,
      pim_category_name: item.pim_category_name,
      pim_make: item.pim_make,
      pim_product_name: item.pim_product_name,
      pim_product_model: item.pim_product_model,
      pim_product_year: item.pim_product_year,
    }));
  }, [data]);

  const columns: GridColDef[] = [
    {
      field: "photo",
      headerName: "",
      width: 60,
      renderCell: (params) => {
        if (!params.value) return <></>;
        return (
          <Box
            component="img"
            src={params.value}
            alt="Asset photo"
            sx={{
              width: 32,
              height: 32,
              marginTop: 1,
              borderRadius: 2, // 2 * 4px = 8px for a rounded box
              objectFit: "cover",
              background: "#f0f0f0",
              display: "block",
            }}
          />
        );
      },
      sortable: false,
      filterable: false,
    },
    { field: "id", headerName: "ID", width: 100 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "company", headerName: "Company", flex: 1 },
    { field: "custom_name", headerName: "Custom Name", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    { field: "pim_category_name", headerName: "Category", flex: 1 },
    { field: "pim_make", headerName: "Make", flex: 1 },
    { field: "pim_product_name", headerName: "Product Name", flex: 1 },
    { field: "pim_product_model", headerName: "Model", flex: 1 },
    { field: "pim_product_year", headerName: "Year", width: 120 },
  ];

  // Memoised list of rows that match the current search term. We run a simple
  // case-insensitive substring match against every primitive value in the row
  // object so that the search works across all visible columns.
  const filteredRows = React.useMemo(() => {
    if (!searchTerm) return rows;

    const lower = searchTerm.toLowerCase();

    return rows.filter((row) =>
      Object.values(row).some((value) => (value ?? "").toString().toLowerCase().includes(lower)),
    );
  }, [rows, searchTerm]);

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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
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
          <DataGridPremium
            columns={columns}
            rows={filteredRows}
            loading={loading}
            getDetailPanelContent={({ row }) => (
              <Box sx={{ p: 2 }}>
                <Card
                  variant="outlined"
                  sx={{ maxWidth: 600, mx: "auto", boxShadow: 2 }}
                  data-test="inventory-detail-panel"
                >
                  {row.photo_large && (
                    <CardMedia
                      component="img"
                      image={row.photo_large}
                      alt={row.name}
                      sx={{
                        width: "100%",
                        maxHeight: 220,
                        objectFit: "cover",
                        background: "#f5f5f5",
                        borderBottom: "1px solid #eee",
                      }}
                    />
                  )}
                  <CardContent>
                    <Typography
                      gutterBottom
                      variant="h5"
                      component="div"
                      data-test="inventory-asset-name"
                    >
                      {row.name || row.custom_name}
                    </Typography>
                    <Grid container spacing={2}>
                      {[
                        ["ID", row.id],
                        ["Photo ID", row.photo_id],
                        ["Company", row.company],
                        ["Custom Name", row.custom_name],
                        ["Description", row.description],
                        ["Category", row.pim_category_name],
                        ["Make", row.pim_make],
                        ["Product Name", row.pim_product_name],
                        ["Model", row.pim_product_model],
                        ["Product Year", row.pim_product_year],
                      ].map(([label, value]) => (
                        <Grid key={label} size={4} alignItems="center">
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontWeight: 500 }}
                            {...(label === "ID" ? { "data-test": "inventory-asset-id" } : {})}
                          >
                            {label}
                          </Typography>

                          <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                            {value || <span style={{ color: "#aaa" }}>—</span>}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<CalendarTodayIcon />}
                      sx={{ minWidth: 180 }}
                      data-test="inventory-schedule-btn"
                    >
                      See Asset Schedule
                    </Button>
                  </CardActions>
                </Card>
              </Box>
            )}
            getDetailPanelHeight={({ row }) => "auto"}
            initialState={{
              pagination: { paginationModel: { pageSize } },
            }}
            hideFooter
          />
        </Box>
      </Container>
    </PageContainer>
  );
}
