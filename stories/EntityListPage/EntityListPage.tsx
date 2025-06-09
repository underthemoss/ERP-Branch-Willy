import React from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Select,
  MenuItem,
} from "@mui/material";
import { DataGridPremium, GridColDef } from "@mui/x-data-grid-premium";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

export type EntityListPageFilter = {
  key: string;
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  "data-testid"?: string;
};

export type EntityListPageProps = {
  title: string;
  description?: string;
  createButtonLabel?: string;
  onCreateClick?: () => void;
  columns: GridColDef[];
  rows: any[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: EntityListPageFilter[];
};

export function EntityListPage({
  title,
  description,
  createButtonLabel,
  onCreateClick,
  columns,
  rows,
  loading,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filters = [],
}: EntityListPageProps) {
  return (
    <Container maxWidth="xl">
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mt={4}
        mb={1}
      >
        <Typography variant="h1">{title}</Typography>
        {createButtonLabel && onCreateClick && (
          <Button
            variant="contained"
            color="primary"
            sx={{ textTransform: "none", fontWeight: 600 }}
            onClick={onCreateClick}
          >
            {createButtonLabel}
          </Button>
        )}
      </Box>
      {description && (
        <Typography variant="body1" color="text.secondary" mb={2}>
          {description}
        </Typography>
      )}
      <Box mb={2} display="flex" gap={2} alignItems="center">
        <TextField
          placeholder={searchPlaceholder || "Search"}
          variant="outlined"
          size="small"
          fullWidth
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchValue ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSearchChange("")}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
        />
        {filters.map((filter) => (
          <Select
            key={filter.key}
            size="small"
            multiple
            displayEmpty
            value={filter.value}
            onChange={(e) => {
              const value = e.target.value;
              filter.onChange(
                typeof value === "string"
                  ? value === ""
                    ? []
                    : [value]
                  : (value as string[]),
              );
            }}
            renderValue={(selected) => {
              if (
                !selected ||
                (Array.isArray(selected) && selected.length === 0)
              ) {
                return `All ${filter.label}`;
              }
              return (selected as string[]).join(", ");
            }}
            sx={{ minWidth: 180 }}
            data-testid={filter["data-testid"]}
            MenuProps={{
              MenuListProps: {
                dense: true,
              },
            }}
          >
            <MenuItem value="">
              <em>All {filter.label}</em>
            </MenuItem>
            {filter.options.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        ))}
      </Box>
      <Box sx={{ height: 600 }}>
        <div style={{ height: "100%" }}>
          <DataGridPremium
            columns={columns}
            rows={rows}
            loading={loading}
            disableRowSelectionOnClick
            hideFooter
            getRowId={(row) => row.id}
            initialState={{
              pinnedColumns: { left: ["id"] },
            }}
            sx={{
              cursor: "pointer",
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "#f5f5f5",
              },
            }}
          />
        </div>
      </Box>
    </Container>
  );
}
