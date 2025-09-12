"use client";

import { useListAvailableRelationsQuery } from "@/graphql/hooks";
import { ClearOutlined, FilterListOutlined } from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Option,
  Select,
  Sheet,
  Stack,
  Tooltip,
  Typography,
} from "@mui/joy";
import { useEffect, useState } from "react";

interface RelationshipFiltersProps {
  resourceTypes: string[];
  onFiltersChange: (filters: {
    resourceType?: string;
    resourceId?: string;
    relation?: string;
    subjectType?: string;
    subjectId?: string;
  }) => void;
  initialFilters?: {
    resourceType?: string;
    resourceId?: string;
    relation?: string;
    subjectType?: string;
    subjectId?: string;
  };
}

export function RelationshipFilters({
  resourceTypes,
  onFiltersChange,
  initialFilters = {},
}: RelationshipFiltersProps) {
  const [filters, setFilters] = useState(initialFilters);

  // Fetch available relations from the API
  const { data: relationsData, loading: relationsLoading } = useListAvailableRelationsQuery({
    variables: {
      resourceType: filters.resourceType || undefined,
    },
    fetchPolicy: "cache-and-network",
  });

  const availableRelations = relationsData?.admin?.listAvailableRelations || [];

  const handleFilterChange = (key: string, value: string | null) => {
    const newFilters = { ...filters };
    if (value === null || value === "") {
      delete newFilters[key as keyof typeof filters];
    } else {
      (newFilters as any)[key] = value;
    }
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <Sheet
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: "sm",
        bgcolor: "background.level1",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <FilterListOutlined sx={{ mr: 1, fontSize: 20 }} />
        <Typography level="title-md" sx={{ flex: 1 }}>
          Filters
        </Typography>
        {hasActiveFilters && (
          <Tooltip title="Clear all filters">
            <IconButton size="sm" variant="plain" onClick={clearFilters}>
              <ClearOutlined />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Stack spacing={1.5}>
        <FormControl size="sm">
          <FormLabel sx={{ fontSize: 12 }}>Resource Type</FormLabel>
          <Select
            placeholder="All types"
            value={filters.resourceType || null}
            onChange={(_, value) => handleFilterChange("resourceType", value)}
            slotProps={{
              button: {
                sx: {
                  fontFamily: "monospace",
                  fontSize: 12,
                  minHeight: 32,
                  "& .MuiSelect-indicator": {
                    marginLeft: 0.5,
                  },
                },
              },
            }}
          >
            <Option value={null}>All types</Option>
            {resourceTypes.map((type) => (
              <Option key={type} value={type}>
                <Typography
                  sx={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={type}
                >
                  {type}
                </Typography>
              </Option>
            ))}
          </Select>
        </FormControl>

        <FormControl size="sm">
          <FormLabel sx={{ fontSize: 12 }}>Resource ID</FormLabel>
          <Input
            placeholder="e.g., workspace123"
            value={filters.resourceId || ""}
            onChange={(e) => handleFilterChange("resourceId", e.target.value)}
            sx={{
              fontFamily: "monospace",
              fontSize: 12,
              minHeight: 32,
              "& input": {
                padding: "4px 8px",
              },
            }}
          />
        </FormControl>

        <FormControl size="sm">
          <FormLabel sx={{ fontSize: 12 }}>
            Relation
            {relationsLoading && <CircularProgress size="sm" sx={{ ml: 1 }} />}
          </FormLabel>
          <Select
            placeholder="All relations"
            value={filters.relation || null}
            onChange={(_, value) => handleFilterChange("relation", value)}
            disabled={relationsLoading}
            slotProps={{
              button: {
                sx: {
                  fontFamily: "monospace",
                  fontSize: 12,
                  minHeight: 32,
                  "& .MuiSelect-indicator": {
                    marginLeft: 0.5,
                  },
                },
              },
            }}
          >
            <Option value={null}>All relations</Option>
            {availableRelations.map((rel) => (
              <Option key={rel.relation} value={rel.relation}>
                <Tooltip title={rel.description || rel.relation} placement="right" arrow>
                  <Box sx={{ width: "100%" }}>
                    <Typography sx={{ fontFamily: "monospace", fontSize: 12 }}>
                      {rel.relation}
                    </Typography>
                    {rel.isComputed && (
                      <Typography
                        level="body-xs"
                        sx={{
                          color: "text.secondary",
                          fontSize: 10,
                          fontStyle: "italic",
                        }}
                      >
                        computed
                      </Typography>
                    )}
                  </Box>
                </Tooltip>
              </Option>
            ))}
          </Select>
        </FormControl>

        <FormControl size="sm">
          <FormLabel sx={{ fontSize: 12 }}>Subject Type</FormLabel>
          <Select
            placeholder="All types"
            value={filters.subjectType || null}
            onChange={(_, value) => handleFilterChange("subjectType", value)}
            slotProps={{
              button: {
                sx: {
                  fontFamily: "monospace",
                  fontSize: 12,
                  minHeight: 32,
                  "& .MuiSelect-indicator": {
                    marginLeft: 0.5,
                  },
                },
              },
            }}
          >
            <Option value={null}>All types</Option>
            {resourceTypes.map((type) => (
              <Option key={type} value={type}>
                <Typography
                  sx={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={type}
                >
                  {type}
                </Typography>
              </Option>
            ))}
          </Select>
        </FormControl>

        <FormControl size="sm">
          <FormLabel sx={{ fontSize: 12 }}>Subject ID</FormLabel>
          <Input
            placeholder="e.g., user456"
            value={filters.subjectId || ""}
            onChange={(e) => handleFilterChange("subjectId", e.target.value)}
            sx={{
              fontFamily: "monospace",
              fontSize: 12,
              minHeight: 32,
              "& input": {
                padding: "4px 8px",
              },
            }}
          />
        </FormControl>

        {hasActiveFilters && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
            <Typography level="body-xs" sx={{ color: "text.secondary" }}>
              Active filters: {Object.keys(filters).length}
            </Typography>
          </Box>
        )}
      </Stack>
    </Sheet>
  );
}
