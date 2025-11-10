"use client";

import ClearIcon from "@mui/icons-material/Clear";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import GroupsIcon from "@mui/icons-material/Groups";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { BuyerIndividualQuotesView } from "./components/BuyerIndividualQuotesView";
import { BuyerRFQsView } from "./components/BuyerRFQsView";
import { CreateSalesQuoteDialog } from "./components/CreateSalesQuoteDialog";
import { SellerQuotesView } from "./components/SellerQuotesView";

export default function QuotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [activeTab, setActiveTab] = React.useState(0);
  const [createQuoteDialogOpen, setCreateQuoteDialogOpen] = React.useState(false);

  // Get view mode from URL, default to "buyer"
  const viewMode = (searchParams.get("view") as "buyer" | "seller") || "buyer";

  const handleViewModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: "buyer" | "seller",
  ) => {
    if (newMode !== null) {
      // Update URL with new view mode
      const params = new URLSearchParams(searchParams);
      params.set("view", newMode);
      router.push(`?${params.toString()}`);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box display="flex" alignItems="center" justifyContent="space-between" mt={4} mb={1}>
        <Box>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="view mode"
            size="small"
            sx={{
              mb: 2,
              "& .MuiToggleButtonGroup-grouped": {
                "&:not(:first-of-type)": {
                  borderLeft: 0,
                  marginLeft: 0,
                },
                "&.Mui-selected": {
                  backgroundColor: "primary.main",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                  },
                },
              },
              "& .MuiToggleButton-root": {
                px: 2.5,
                py: 0.75,
                textTransform: "none",
                fontSize: "14px",
                fontWeight: 500,
              },
            }}
          >
            <ToggleButton value="buyer">As Buyer</ToggleButton>
            <ToggleButton value="seller">As Seller</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            placeholder="Search quotes..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: "300px" }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm("")}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              },
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (viewMode === "seller") {
                setCreateQuoteDialogOpen(true);
              }
              // TODO: Handle buyer view create (RFQ creation)
            }}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              borderRadius: "8px",
            }}
          >
            + Create
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h1" sx={{ mb: 0.5 }}>
          {viewMode === "buyer" ? "Purchase Requests" : "Sales Quotes"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {viewMode === "buyer"
            ? "Quotes you've requested from other businesses"
            : "Quotes you've created for customers"}
        </Typography>
      </Box>

      {viewMode === "buyer" && (
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="quote tabs">
            <Tab
              icon={<GroupsIcon />}
              iconPosition="start"
              label="RFQs"
              sx={{
                textTransform: "none",
                fontWeight: 500,
                fontSize: "14px",
                minHeight: "48px",
              }}
            />
            <Tab
              icon={<DescriptionOutlinedIcon />}
              iconPosition="start"
              label="Individual Quotes"
              sx={{
                textTransform: "none",
                fontWeight: 500,
                fontSize: "14px",
                minHeight: "48px",
              }}
            />
            <Tab
              label="IFB"
              sx={{
                textTransform: "none",
                fontWeight: 500,
                fontSize: "14px",
                minHeight: "48px",
              }}
            />
            <Tab
              label="RFP"
              sx={{
                textTransform: "none",
                fontWeight: 500,
                fontSize: "14px",
                minHeight: "48px",
              }}
            />
          </Tabs>
        </Box>
      )}

      <Box sx={{ height: 600 }}>
        {viewMode === "seller" ? (
          <SellerQuotesView searchTerm={searchTerm} />
        ) : activeTab === 0 ? (
          <BuyerRFQsView searchTerm={searchTerm} />
        ) : activeTab === 1 ? (
          <BuyerIndividualQuotesView searchTerm={searchTerm} />
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Typography color="text.secondary">No data available for this tab</Typography>
          </Box>
        )}
      </Box>

      <CreateSalesQuoteDialog
        open={createQuoteDialogOpen}
        onClose={() => setCreateQuoteDialogOpen(false)}
      />
    </Container>
  );
}
