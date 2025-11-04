"use client";

import { createSearchClient } from "@/lib/searchClient";
import { useAuth0 } from "@auth0/auth0-react";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Checkbox,
  Chip,
  Container,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  MenuItem,
  Pagination as MuiPagination,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { PageContainer } from "@toolpad/core/PageContainer";
import { history } from "instantsearch.js/es/lib/routers";
import { simple } from "instantsearch.js/es/lib/stateMappings";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import {
  Configure,
  InstantSearch,
  useClearRefinements,
  useCurrentRefinements,
  useHits,
  usePagination,
  useRefinementList,
  useSearchBox,
  useSortBy,
  useStats,
} from "react-instantsearch";

// Asset data structure
interface AssetHit {
  objectID: string;
  details: {
    asset_id: string;
    custom_name: string | null;
    name: string | null;
    description: string | null;
    year: string | null;
    serial_number: string | null;
    vin: string | null;
    model: string | null;
  };
  type: { id: string; name: string };
  make: { id: string | null; name: string | null };
  model: { id: string | null; name: string | null };
  class: { id: string | null; name: string | null };
  company: { id: string; name: string };
  inventory_branch: {
    id: string;
    name: string;
  } | null;
  tracker: { id: string | null };
  photo: { photo_id: string | null; filename: string | null };
}

// E-commerce style search box
function SearchBar() {
  const { query, refine } = useSearchBox();
  const [localQuery, setLocalQuery] = React.useState(query);

  React.useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  return (
    <TextField
      fullWidth
      variant="outlined"
      value={localQuery}
      onChange={(e) => {
        setLocalQuery(e.target.value);
        refine(e.target.value);
      }}
      placeholder="Search equipment, vehicles, tools..."
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ fontSize: 28 }} />
          </InputAdornment>
        ),
        endAdornment: localQuery && (
          <InputAdornment position="end">
            <IconButton
              size="small"
              onClick={() => {
                setLocalQuery("");
                refine("");
              }}
            >
              <ClearIcon />
            </IconButton>
          </InputAdornment>
        ),
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          backgroundColor: "white",
          fontSize: "16px",
        },
      }}
    />
  );
}

// Filter section (Amazon style - clickable checkboxes)
interface FilterProps {
  title: string;
  attribute: string;
  searchable?: boolean;
}

function FilterSection({ title, attribute, searchable = false }: FilterProps) {
  const { items, refine, searchForItems } = useRefinementList({
    attribute,
    limit: 100,
  });
  const [showAll, setShowAll] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  if (items.length === 0) return null;

  const displayItems = showAll ? items : items.slice(0, 5);

  return (
    <Box mb={2.5}>
      <Typography
        variant="subtitle2"
        fontWeight={600}
        mb={1}
        fontSize="13px"
        textTransform="uppercase"
        letterSpacing="0.5px"
        color="text.secondary"
      >
        {title}
      </Typography>

      {searchable && (
        <TextField
          size="small"
          placeholder={`Search ${title.toLowerCase()}...`}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchForItems(e.target.value);
          }}
          fullWidth
          sx={{
            mb: 1,
            "& .MuiOutlinedInput-root": {
              fontSize: "13px",
              backgroundColor: "white",
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => {
                    setSearchQuery("");
                    searchForItems("");
                  }}
                  sx={{ p: 0.5 }}
                >
                  <ClearIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      )}

      <FormGroup sx={{ gap: 0.25 }}>
        {displayItems.map((item) => (
          <FormControlLabel
            key={item.label}
            control={
              <Checkbox
                checked={item.isRefined}
                onChange={() => refine(item.value)}
                size="small"
                sx={{ py: 0.25 }}
              />
            }
            label={
              <Box display="flex" alignItems="center" width="100%" gap={0.5}>
                <Typography variant="body2" sx={{ flex: 1, fontSize: "13px" }}>
                  {item.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontSize="11px">
                  ({item.count})
                </Typography>
              </Box>
            }
            sx={{ my: 0, ml: -0.5 }}
          />
        ))}
      </FormGroup>
      {items.length > 5 && (
        <Button
          size="small"
          onClick={() => setShowAll(!showAll)}
          sx={{
            mt: 0.5,
            textTransform: "none",
            fontSize: "12px",
            p: 0,
            minWidth: "auto",
            color: "primary.main",
            "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
          }}
        >
          {showAll ? "Show less" : `+ ${items.length - 5} more`}
        </Button>
      )}
    </Box>
  );
}

// Active filters display
function ActiveFilters() {
  const { items } = useCurrentRefinements();
  const { refine: clear } = useClearRefinements();

  if (items.length === 0) return null;

  return (
    <Box mb={2} display="flex" flexWrap="wrap" gap={1} alignItems="center">
      {items.map((item) =>
        item.refinements.map((refinement) => (
          <Chip
            key={`${item.attribute}-${refinement.label}`}
            label={`${item.label}: ${refinement.label}`}
            onDelete={() => item.refine(refinement)}
            size="small"
            sx={{ borderRadius: "4px" }}
          />
        )),
      )}
      {items.length > 0 && (
        <Button
          size="small"
          onClick={() => clear()}
          startIcon={<ClearIcon />}
          sx={{ textTransform: "none" }}
        >
          Clear all filters
        </Button>
      )}
    </Box>
  );
}

// Stats and sort
function ResultsBar() {
  const { nbHits } = useStats();
  const { currentRefinement, options, refine } = useSortBy({
    items: [
      { label: "Featured", value: "t3_assets" },
      { label: "Price: Low to High", value: "t3_assets_price_asc" },
      { label: "Price: High to Low", value: "t3_assets_price_desc" },
      { label: "Newest First", value: "t3_assets_date_desc" },
    ],
  });

  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} py={2}>
      <Typography variant="body1" fontWeight={500}>
        {nbHits.toLocaleString()} results
      </Typography>
      <Box display="flex" alignItems="center" gap={1}>
        <Typography variant="body2" color="text.secondary">
          Sort by:
        </Typography>
        <Select
          size="small"
          value={currentRefinement}
          onChange={(e) => refine(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Box>
  );
}

// Product card (Amazon style)
function ProductCard({ hit, workspaceId }: { hit: AssetHit; workspaceId: string }) {
  const name = hit.details.custom_name || hit.details.name || "Unnamed Asset";
  const assetId = hit.details.asset_id;
  const type = hit.type.name;
  const make = hit.make?.name || "-";
  const model = hit.model?.name || "-";
  const year = hit.details.year || "-";
  const imageUrl = hit.photo?.filename
    ? `https://appcdn.equipmentshare.com/uploads/small/${hit.photo.filename}`
    : "https://appcdn.equipmentshare.com/img/cogplaceholder.png";

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: 6,
          transform: "translateY(-4px)",
        },
      }}
    >
      <CardMedia
        component="div"
        sx={{
          height: 200,
          backgroundColor: "grey.200",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          component="img"
          src={imageUrl}
          alt={name}
          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e: any) => {
            // If image fails to load, use the placeholder
            e.target.src = "https://appcdn.equipmentshare.com/img/cogplaceholder.png";
          }}
        />
      </CardMedia>
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography
          variant="h6"
          component="div"
          gutterBottom
          sx={{
            fontSize: "16px",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            minHeight: "48px",
          }}
        >
          {name}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {make} {model}
        </Typography>
        <Box display="flex" gap={0.5} flexWrap="wrap" mt={1}>
          <Chip label={type} size="small" color="primary" variant="outlined" />
          {year !== "-" && <Chip label={year} size="small" variant="outlined" />}
          {hit.tracker?.id && (
            <Chip label="GPS Tracked" size="small" color="success" variant="outlined" />
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
          Asset ID: {assetId}
        </Typography>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<ShoppingCartIcon />}
          sx={{ textTransform: "none", fontWeight: 600 }}
          href={`/app/${workspaceId}/assets/${assetId}`}
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
}

// Product grid
function ProductGrid({ workspaceId }: { workspaceId: string }) {
  const { hits } = useHits<AssetHit>();

  if (hits.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h6" color="text.secondary">
          No results found
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Try adjusting your search or filters
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {hits.map((hit) => (
        <Grid key={hit.objectID} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <ProductCard hit={hit} workspaceId={workspaceId} />
        </Grid>
      ))}
    </Grid>
  );
}

// MUI-styled Pagination
function CustomPagination() {
  const { currentRefinement, nbPages, refine } = usePagination();

  if (nbPages <= 1) return null;

  return (
    <MuiPagination
      count={nbPages}
      page={currentRefinement + 1}
      onChange={(_, page) => refine(page - 1)}
      color="primary"
      size="large"
      showFirstButton
      showLastButton
      sx={{
        "& .MuiPagination-ul": {
          justifyContent: "center",
        },
      }}
    />
  );
}

export default function AssetSearchPage({ params }: { params: { workspace_id: string } }) {
  const { getAccessTokenSilently } = useAuth0();
  const [searchClient, setSearchClient] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const workspaceId = params.workspace_id;

  React.useEffect(() => {
    async function initializeSearch() {
      try {
        const token = await getAccessTokenSilently({ cacheMode: "on" });
        const client = createSearchClient(token);
        setSearchClient(client);
      } catch (err) {
        console.error("Error initializing search client:", err);
        setError("Failed to initialize search. Please try refreshing the page.");
      }
    }

    initializeSearch();
  }, [getAccessTokenSilently]);

  if (error) {
    return (
      <PageContainer>
        <Container maxWidth="xl">
          <Box mt={4}>
            <Typography color="error">{error}</Typography>
          </Box>
        </Container>
      </PageContainer>
    );
  }

  if (!searchClient) {
    return (
      <PageContainer>
        <Container maxWidth="xl">
          <Box mt={4}>
            <Typography>Loading search...</Typography>
          </Box>
        </Container>
      </PageContainer>
    );
  }

  const routing = {
    router: history({
      cleanUrlOnDispose: false,
    }),
    stateMapping: simple(),
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <InstantSearch searchClient={searchClient} indexName="t3_assets" routing={routing}>
        <Configure hitsPerPage={24} />

        {/* Top Search Section - White Background */}
        <Box sx={{ backgroundColor: "white", borderBottom: "1px solid", borderColor: "divider" }}>
          <Box sx={{ maxWidth: 1600, mx: "auto", px: 3, py: 2 }}>
            <SearchBar />
          </Box>
        </Box>

        {/* Main Content Area */}
        <Box sx={{ maxWidth: 1600, mx: "auto" }}>
          <Box display="flex" alignItems="flex-start">
            {/* Sidebar Filters - Light Gray Background */}
            <Box
              sx={{
                width: 240,
                flexShrink: 0,
                backgroundColor: "#fafafa",
                borderRight: "1px solid",
                borderColor: "divider",
                minHeight: "calc(100vh - 73px)",
                position: "sticky",
                top: 0,
                overflowY: "auto",
                maxHeight: "100vh",
                py: 2,
                px: 2,
              }}
            >
              <Typography variant="h6" fontWeight={700} mb={2} fontSize="16px" px={0.5}>
                Filters
              </Typography>

              <FilterSection title="Asset Type" attribute="type" />
              <FilterSection title="Make" attribute="make" searchable />
              <FilterSection title="Model" attribute="model" searchable />
              <FilterSection title="Class" attribute="class" />
              <FilterSection title="Year" attribute="year" />
              <FilterSection title="Location" attribute="inventory_branch" />
            </Box>

            {/* Main Content - White Background */}
            <Box
              flex={1}
              minWidth={0}
              sx={{
                backgroundColor: "white",
                minHeight: "calc(100vh - 73px)",
              }}
            >
              <Box p={3}>
                {/* Breadcrumbs */}
                <Breadcrumbs sx={{ mb: 2, fontSize: "13px" }}>
                  <Link underline="hover" color="text.secondary" href="#" fontSize="13px">
                    Home
                  </Link>
                  <Link underline="hover" color="text.secondary" href="#" fontSize="13px">
                    Inventory
                  </Link>
                  <Typography color="text.primary" fontSize="13px">
                    Asset Search
                  </Typography>
                </Breadcrumbs>

                <Typography variant="h4" fontWeight={700} mb={2}>
                  Equipment & Assets
                </Typography>

                <ActiveFilters />
                <ResultsBar />
                <ProductGrid workspaceId={workspaceId} />

                {/* Pagination */}
                <Box mt={4} mb={2} display="flex" justifyContent="center">
                  <CustomPagination />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </InstantSearch>
    </Box>
  );
}
