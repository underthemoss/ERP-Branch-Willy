"use client";

import { graphql } from "@/graphql";
import { useListInventoryGroupedByPimCategoryIdQuery } from "@/graphql/hooks";
import ClearIcon from "@mui/icons-material/Clear";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import ImageIcon from "@mui/icons-material/Image";
import SearchIcon from "@mui/icons-material/Search";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { PageContainer } from "@toolpad/core/PageContainer";
import { useParams } from "next/navigation";
import * as React from "react";
import { useState } from "react";

graphql(`
  query ListInventoryGroupedByPimCategoryId($query: ListInventoryQuery) {
    listInventoryGroupedByPimCategoryId(query: $query) {
      items {
        pimCategoryId
        pimCategoryName
        pimCategoryPath
        quantityOnOrder
        quantityReceived
        totalQuantity
        sampleInventoryIds
        sampleInventories {
          id
          assetId
          pimProductId
          pimCategoryName
          asset {
            id
            name
            custom_name
            description
            photo {
              filename
              photo_id
            }
            pim_product_name
            pim_product_model
            pim_make
            pim_product_year
          }
        }
      }
      pageNumber
      pageSize
      totalCount
      totalPages
    }
  }
`);

export default function Inventory() {
  const params = useParams();
  const workspaceId = params?.workspace_id as string;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [thirdPartyFilter, setThirdPartyFilter] = useState<string>("ALL");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const { data, loading } = useListInventoryGroupedByPimCategoryIdQuery({
    variables: {
      query: {
        filter: {
          workspaceId: workspaceId,
          ...(statusFilter !== "ALL" && { status: statusFilter as any }),
          ...(thirdPartyFilter !== "ALL" && {
            isThirdPartyRental: thirdPartyFilter === "THIRD_PARTY",
          }),
        },
        page: {
          number: page,
          size: itemsPerPage,
        },
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const categories = React.useMemo(() => {
    const items = data?.listInventoryGroupedByPimCategoryId?.items || [];
    return items.map((item) => ({
      id: item.pimCategoryId ?? "unknown",
      name: item.pimCategoryName ?? "Uncategorized",
      path: item.pimCategoryPath ?? "",
      quantityOnOrder: item.quantityOnOrder ?? 0,
      quantityReceived: item.quantityReceived ?? 0,
      totalQuantity: item.totalQuantity ?? 0,
      sampleInventoryIds: item.sampleInventoryIds ?? [],
      sampleInventories: item.sampleInventories ?? [],
    }));
  }, [data]);

  // Filter categories based on search term (client-side for now)
  const filteredCategories = React.useMemo(() => {
    if (!searchTerm) return categories;

    const lower = searchTerm.toLowerCase();

    return categories.filter((category) =>
      Object.values(category).some((value) => {
        if (Array.isArray(value)) return false;
        return value?.toString().toLowerCase().includes(lower);
      }),
    );
  }, [categories, searchTerm]);

  // Get pagination info from backend response
  const totalPages = data?.listInventoryGroupedByPimCategoryId?.totalPages || 0;
  const totalCount = data?.listInventoryGroupedByPimCategoryId?.totalCount || 0;

  // Update active filters display
  React.useEffect(() => {
    const filters: string[] = [];
    if (statusFilter !== "ALL") {
      filters.push(`Status: ${statusFilter}`);
    }
    if (thirdPartyFilter !== "ALL") {
      filters.push(thirdPartyFilter === "THIRD_PARTY" ? "Third Party Rental" : "Own Inventory");
    }
    setActiveFilters(filters);
  }, [statusFilter, thirdPartyFilter]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, thirdPartyFilter]);

  const removeFilter = (filter: string) => {
    if (filter.startsWith("Status:")) {
      setStatusFilter("ALL");
    } else if (filter === "Third Party Rental" || filter === "Own Inventory") {
      setThirdPartyFilter("ALL");
    }
  };

  const handleAccordionChange =
    (categoryId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedCategories((prev) =>
        isExpanded ? [...prev, categoryId] : prev.filter((id) => id !== categoryId),
      );
    };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    // Scroll to top of the accordion section
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Helper function to get asset image URL
  const getAssetImageUrl = (asset: any) => {
    if (!asset?.photo?.filename) return undefined;
    // Use the production CDN for asset photos to prevent broken image links in non-prod environments,
    // as lower environments may have incomplete or missing photo data. This is a temporary workaround
    // until data hygiene is improved across all environments.
    return `https://appcdn.equipmentshare.com/uploads/small/${asset.photo.filename}`;
  };

  // Helper function to get asset display name
  const getAssetDisplayName = (asset: any) => {
    if (!asset) return "Unknown Asset";
    return (
      asset.custom_name ||
      asset.name ||
      asset.pim_product_name ||
      `${asset.pim_make || ""} ${asset.pim_product_model || ""} ${asset.pim_product_year || ""}`.trim() ||
      "Unknown Asset"
    );
  };

  // Helper function to parse and format PIM path
  const formatPimPath = (path: string) => {
    if (!path) return "";
    // Split by pipe, remove empty strings, filter out "Categories", and join with " > "
    return path
      .split("|")
      .filter((part) => part.trim() !== "" && part.trim() !== "Categories")
      .join(" > ");
  };

  return (
    <PageContainer>
      <Container maxWidth="lg">
        <Typography variant="h1" mt={4} mb={1}>
          Inventory Management
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={2}>
          Track and manage inventory items grouped by category.
        </Typography>

        {/* Search & Filter Row */}
        <Box display="flex" gap={2} alignItems="center" mb={2}>
          <TextField
            placeholder="Search categories"
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

          <Select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            displayEmpty
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="ON_ORDER">On Order</MenuItem>
            <MenuItem value="RECEIVED">Received</MenuItem>
          </Select>

          <Select
            size="small"
            value={thirdPartyFilter}
            onChange={(e) => setThirdPartyFilter(e.target.value)}
            displayEmpty
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="ALL">All Inventory</MenuItem>
            <MenuItem value="THIRD_PARTY">Third Party Rental</MenuItem>
            <MenuItem value="OWN">Own Inventory</MenuItem>
          </Select>

          <IconButton>
            <FilterAltOutlinedIcon />
          </IconButton>
        </Box>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
            {activeFilters.map((filter, idx) => (
              <Chip
                key={idx}
                label={filter}
                onDelete={() => removeFilter(filter)}
                deleteIcon={<ClearIcon />}
                size="small"
              />
            ))}
          </Box>
        )}

        {/* Quick Filter Chips */}
        <Box mt={3} mb={2}>
          <Chip
            label="On Order"
            onClick={() => setStatusFilter(statusFilter === "ON_ORDER" ? "ALL" : "ON_ORDER")}
            color={statusFilter === "ON_ORDER" ? "primary" : "default"}
            variant={statusFilter === "ON_ORDER" ? "filled" : "outlined"}
            clickable
            sx={{ mr: 1 }}
          />
          <Chip
            label="Received"
            onClick={() => setStatusFilter(statusFilter === "RECEIVED" ? "ALL" : "RECEIVED")}
            color={statusFilter === "RECEIVED" ? "primary" : "default"}
            variant={statusFilter === "RECEIVED" ? "filled" : "outlined"}
            clickable
            sx={{ mr: 1 }}
          />
          <Chip
            label="Third Party Rentals"
            onClick={() =>
              setThirdPartyFilter(thirdPartyFilter === "THIRD_PARTY" ? "ALL" : "THIRD_PARTY")
            }
            color={thirdPartyFilter === "THIRD_PARTY" ? "primary" : "default"}
            variant={thirdPartyFilter === "THIRD_PARTY" ? "filled" : "outlined"}
            clickable
            sx={{ mr: 1 }}
          />
          <Chip
            label="Own Inventory"
            onClick={() => setThirdPartyFilter(thirdPartyFilter === "OWN" ? "ALL" : "OWN")}
            color={thirdPartyFilter === "OWN" ? "primary" : "default"}
            variant={thirdPartyFilter === "OWN" ? "filled" : "outlined"}
            clickable
          />
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Categories
                </Typography>
                <Typography variant="h4">{totalCount || filteredCategories.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Items (Current Page)
                </Typography>
                <Typography variant="h4">
                  {filteredCategories.reduce((sum, cat) => sum + cat.totalQuantity, 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Items On Order (Current Page)
                </Typography>
                <Typography variant="h4">
                  {filteredCategories.reduce((sum, cat) => sum + cat.quantityOnOrder, 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Container maxWidth="lg">
        {/* Category Accordions */}
        <Box sx={{ mt: 2 }}>
          {loading ? (
            <Typography>Loading inventory...</Typography>
          ) : filteredCategories.length === 0 ? (
            <Card>
              <CardContent>
                <Typography variant="h6" align="center" color="text.secondary">
                  No inventory categories found
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <>
              {filteredCategories.map((category) => (
                <Accordion
                  key={category.id}
                  expanded={expandedCategories.includes(category.id)}
                  onChange={handleAccordionChange(category.id)}
                  sx={{ mb: 1 }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls={`${category.id}-content`}
                    id={`${category.id}-header`}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", width: "100%", gap: 2 }}>
                      {/* Asset Images Thumbnail Grid */}
                      <Box
                        sx={{
                          width: 120,
                          height: 120,
                          flexShrink: 0,
                          display: "grid",
                          gridTemplateColumns:
                            category.sampleInventories?.length > 1 ? "1fr 1fr" : "1fr",
                          gridTemplateRows:
                            category.sampleInventories?.length > 2 ? "1fr 1fr" : "1fr",
                          gap: 0.5,
                          borderRadius: 1,
                          overflow: "hidden",
                          backgroundColor: "grey.100",
                        }}
                      >
                        {category.sampleInventories && category.sampleInventories.length > 0 ? (
                          category.sampleInventories
                            .slice(0, 4)
                            .map((inventory: any, index: number) => (
                              <Box
                                key={inventory.id || index}
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  position: "relative",
                                  backgroundColor: "grey.200",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {inventory.asset?.photo?.filename ? (
                                  <Box
                                    component="img"
                                    src={getAssetImageUrl(inventory.asset)}
                                    alt=""
                                    sx={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                    onError={(e: any) => {
                                      e.target.style.display = "none";
                                      e.target.nextSibling.style.display = "flex";
                                    }}
                                  />
                                ) : null}
                                <Box
                                  sx={{
                                    width: "100%",
                                    height: "100%",
                                    display: inventory.asset?.photo?.filename ? "none" : "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: "grey.100",
                                  }}
                                >
                                  <ImageIcon sx={{ fontSize: 24, color: "grey.400" }} />
                                </Box>
                              </Box>
                            ))
                        ) : (
                          <Box
                            sx={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gridColumn: "1 / -1",
                              gridRow: "1 / -1",
                            }}
                          >
                            <ImageIcon sx={{ fontSize: 48, color: "grey.400" }} />
                          </Box>
                        )}
                      </Box>

                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6">{category.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatPimPath(category.path)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 3, mr: 2 }}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="body2" color="text.secondary">
                            Total
                          </Typography>
                          <Typography variant="h6">{category.totalQuantity}</Typography>
                        </Box>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="body2" color="text.secondary">
                            On Order
                          </Typography>
                          <Typography variant="h6" color="warning.main">
                            {category.quantityOnOrder}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="body2" color="text.secondary">
                            Received
                          </Typography>
                          <Typography variant="h6" color="success.main">
                            {category.quantityReceived}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid size={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Category Details
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          Category ID: {category.id || "N/A"}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          Category Path: {category.path || "N/A"}
                        </Typography>
                      </Grid>

                      <Grid size={12}>
                        <Typography variant="body2" color="text.secondary">
                          Sample Inventory IDs:{" "}
                          {category.sampleInventoryIds.length > 0
                            ? category.sampleInventoryIds.slice(0, 5).join(", ") +
                              (category.sampleInventoryIds.length > 5 ? "..." : "")
                            : "None"}
                        </Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                    showFirstButton
                    showLastButton
                    siblingCount={1}
                    boundaryCount={1}
                  />
                </Box>
              )}

              {/* Pagination Info */}
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Showing {(page - 1) * itemsPerPage + 1} -{" "}
                  {Math.min(page * itemsPerPage, totalCount || filteredCategories.length)} of{" "}
                  {totalCount || filteredCategories.length} categories
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Container>
    </PageContainer>
  );
}
