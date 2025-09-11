"use client";

import { useGetBrandByIdQuery, useSearchBrandsQuery } from "@/ui/contacts/api";
import { Clear as ClearIcon } from "@mui/icons-material";
import {
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Popover,
  TextField,
  Typography,
} from "@mui/material";
import { debounce } from "lodash";
import { useEffect, useMemo, useRef, useState } from "react";

interface BusinessNameWithBrandSearchProps {
  value: string;
  onChange: (value: string) => void;
  brandId: string | null;
  onBrandIdChange: (brandId: string | null) => void;
  onBrandSelected: (brand: any) => void;
  error?: any;
  helperText?: string;
  required?: boolean;
}

export function BusinessNameWithBrandSearch({
  value,
  onChange,
  brandId,
  onBrandIdChange,
  onBrandSelected,
  error,
  helperText,
  required = false,
}: BusinessNameWithBrandSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const textFieldRef = useRef<HTMLDivElement>(null);

  // Fetch brand details when brandId changes
  const { data: brandData } = useGetBrandByIdQuery({
    variables: { brandId: brandId || "" },
    skip: !brandId,
  });

  // Search brands based on query
  const { data: searchData, loading } = useSearchBrandsQuery({
    variables: { query: searchQuery },
    skip: searchQuery.length < 2,
    fetchPolicy: "cache-and-network",
  });

  // Debounce search query
  const debouncedSetSearchQuery = useMemo(
    () =>
      debounce((query: string) => {
        setSearchQuery(query);
        if (query.length >= 2 && !selectedBrand) {
          setAnchorEl(textFieldRef.current);
        } else {
          setAnchorEl(null);
        }
      }, 300),
    [selectedBrand],
  );

  useEffect(() => {
    // Only search if no brand is selected
    if (value && !selectedBrand) {
      debouncedSetSearchQuery(value);
    }
  }, [value, selectedBrand, debouncedSetSearchQuery]);

  // When brand data is fetched, update selected brand
  useEffect(() => {
    if (brandData?.getBrandById && !selectedBrand) {
      setSelectedBrand(brandData.getBrandById);
      onBrandSelected(brandData.getBrandById);
    }
  }, [brandData?.getBrandById?.id]); // Only depend on id to avoid infinite loops

  const options = searchData?.searchBrands || [];
  const open = Boolean(anchorEl) && options.length > 0 && !selectedBrand;

  const handleSelectBrand = (brand: any) => {
    setSelectedBrand(brand);
    // Handle both brandId (from search) and id (from getBrandById)
    const brandIdValue = brand.brandId || brand.id;
    onBrandIdChange(brandIdValue);
    onChange(brand.name);
    setAnchorEl(null);

    // Fetch full brand details
    onBrandSelected(brand);
  };

  const handleClearBrand = () => {
    setSelectedBrand(null);
    onBrandIdChange(null);
    onBrandSelected(null);
    setSearchQuery("");
    onChange(""); // Clear the business name field as well
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <Box>
      <Box ref={textFieldRef}>
        <TextField
          value={value}
          onChange={handleTextChange}
          label="Business Name"
          required={required}
          fullWidth
          error={error}
          helperText={
            helperText || (!selectedBrand && "Start typing to search for existing brands")
          }
          InputProps={{
            endAdornment: loading && !selectedBrand && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {selectedBrand && (
        <Box
          sx={{
            mt: 1,
            p: 2,
            bgcolor: "grey.50",
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              src={
                selectedBrand.logos?.find((l: any) => l.type === "logo")?.formats?.[0]?.src ||
                selectedBrand.icon ||
                undefined
              }
              sx={{
                width: 48,
                height: 48,
                bgcolor:
                  selectedBrand.logos?.find((l: any) => l.type === "logo")?.theme === "dark"
                    ? "white"
                    : selectedBrand.logos?.find((l: any) => l.type === "logo")?.theme === "light"
                      ? "grey.900"
                      : "white",
                border:
                  selectedBrand.logos?.find((l: any) => l.type === "logo")?.theme === "light"
                    ? "1px solid"
                    : "none",
                borderColor: "grey.300",
                "& img": {
                  objectFit: "contain",
                },
              }}
            >
              {!selectedBrand.logos?.find((l: any) => l.type === "logo")?.formats?.[0]?.src &&
                !selectedBrand.icon &&
                (selectedBrand.name?.[0] || "")}
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              Identified as: <strong>{selectedBrand.name}</strong>
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleClearBrand}
            aria-label="clear brand selection"
            sx={{ ml: 1 }}
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          sx: {
            width: textFieldRef.current?.offsetWidth,
            maxHeight: 300,
            overflow: "auto",
            mt: 1,
          },
        }}
      >
        <List dense>
          {options.map((brand) => (
            <ListItemButton key={brand?.brandId} onClick={() => handleSelectBrand(brand)}>
              <ListItemAvatar>
                <Avatar src={brand?.icon || undefined} sx={{ width: 32, height: 32 }}>
                  {brand?.name?.[0] || ""}
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={brand?.name || ""} secondary={brand?.domain || ""} />
            </ListItemButton>
          ))}
        </List>
      </Popover>
    </Box>
  );
}
