"use client";

import {
  ArrowForwardOutlined,
  DeleteOutlined,
  LinkOutlined,
  MoreVertOutlined,
  SearchOutlined,
} from "@mui/icons-material";
import {
  Box,
  Chip,
  Divider,
  Dropdown,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  Sheet,
  Table,
  Tooltip,
  Typography,
} from "@mui/joy";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Relationship {
  resource: {
    type: string;
    id: string;
  };
  relation: string;
  subject: {
    type: string;
    id: string;
    relation?: string | null;
  };
}

interface RelationshipsTableProps {
  relationships: Relationship[];
  onDelete?: (relationship: Relationship) => void;
  loading?: boolean;
  searchable?: boolean;
}

export function RelationshipsTable({
  relationships,
  onDelete,
  loading = false,
  searchable = true,
}: RelationshipsTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRelationships = searchable
    ? relationships.filter((rel) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          rel.resource.type.toLowerCase().includes(searchLower) ||
          rel.resource.id.toLowerCase().includes(searchLower) ||
          rel.relation.toLowerCase().includes(searchLower) ||
          rel.subject.type.toLowerCase().includes(searchLower) ||
          rel.subject.id.toLowerCase().includes(searchLower) ||
          (rel.subject.relation && rel.subject.relation.toLowerCase().includes(searchLower))
        );
      })
    : relationships;

  const getRelationColor = (relation: string) => {
    switch (relation) {
      case "owner":
        return "danger";
      case "admin":
        return "warning";
      case "member":
      case "editor":
        return "primary";
      case "viewer":
      case "reader":
        return "neutral";
      default:
        return "neutral";
    }
  };

  const navigateToResource = (type: string, id: string) => {
    // URL encode the type since it may contain slashes (e.g., "erp/workspace")
    const encodedType = encodeURIComponent(type);
    const encodedId = encodeURIComponent(id);
    router.push(`/admin/authz/${encodedType}/${encodedId}`);
  };

  const formatSubject = (subject: Relationship["subject"]) => {
    if (subject.relation) {
      return `${subject.type}:${subject.id}#${subject.relation}`;
    }
    return `${subject.type}:${subject.id}`;
  };

  return (
    <Box>
      {searchable && (
        <Box sx={{ mb: 2 }}>
          <Input
            placeholder="Search relationships..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startDecorator={<SearchOutlined />}
            size="sm"
            sx={{ maxWidth: 400 }}
          />
        </Box>
      )}

      <Sheet
        variant="outlined"
        sx={{
          borderRadius: "sm",
          overflow: "auto",
        }}
      >
        <Table
          stickyHeader
          hoverRow
          size="sm"
          sx={{
            "--TableCell-headBackground": "transparent",
            "--Table-headerUnderlineThickness": "1px",
            "& thead th": {
              fontSize: 13,
              fontWeight: 600,
            },
            "& tbody td": {
              fontSize: 13,
            },
            "& thead th:nth-of-type(1)": { width: "30%" },
            "& thead th:nth-of-type(2)": { width: "15%" },
            "& thead th:nth-of-type(3)": { width: "30%" },
            "& thead th:nth-of-type(4)": { width: "15%" },
            "& thead th:nth-of-type(5)": { width: "10%" },
          }}
        >
          <thead>
            <tr>
              <th>Resource</th>
              <th>Relation</th>
              <th>Subject</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRelationships.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <Box
                    sx={{
                      py: 4,
                      textAlign: "center",
                      color: "text.secondary",
                    }}
                  >
                    <Typography level="body-sm">
                      {searchQuery
                        ? "No relationships found matching your search"
                        : "No relationships found"}
                    </Typography>
                  </Box>
                </td>
              </tr>
            ) : (
              filteredRelationships.map((rel, index) => (
                <tr key={index}>
                  <td>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        component="span"
                        sx={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          color: "text.secondary",
                        }}
                      >
                        {rel.resource.type}:
                      </Typography>
                      <Typography
                        component="span"
                        sx={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {rel.resource.id}
                      </Typography>
                      <Tooltip title="Navigate to resource">
                        <IconButton
                          size="sm"
                          variant="plain"
                          onClick={() => navigateToResource(rel.resource.type, rel.resource.id)}
                        >
                          <ArrowForwardOutlined sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </td>
                  <td>
                    <Chip
                      size="sm"
                      color={getRelationColor(rel.relation)}
                      variant="soft"
                      sx={{ fontFamily: "monospace", fontSize: 11 }}
                    >
                      {rel.relation}
                    </Chip>
                  </td>
                  <td>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        component="span"
                        sx={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          color: "text.secondary",
                        }}
                      >
                        {rel.subject.type}:
                      </Typography>
                      <Typography
                        component="span"
                        sx={{
                          fontFamily: "monospace",
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {rel.subject.id}
                      </Typography>
                      {rel.subject.relation && (
                        <>
                          <Typography
                            component="span"
                            sx={{
                              fontFamily: "monospace",
                              fontSize: 12,
                              color: "text.secondary",
                            }}
                          >
                            #
                          </Typography>
                          <Typography
                            component="span"
                            sx={{
                              fontFamily: "monospace",
                              fontSize: 12,
                              fontWeight: 500,
                              color: "primary.500",
                            }}
                          >
                            {rel.subject.relation}
                          </Typography>
                        </>
                      )}
                      {!rel.subject.relation && (
                        <Tooltip title="Navigate to subject">
                          <IconButton
                            size="sm"
                            variant="plain"
                            onClick={() => navigateToResource(rel.subject.type, rel.subject.id)}
                          >
                            <ArrowForwardOutlined sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </td>
                  <td>
                    <Typography
                      sx={{
                        fontFamily: "monospace",
                        fontSize: 11,
                        color: "text.secondary",
                      }}
                    >
                      {rel.subject.relation ? "Set" : "Direct"}
                    </Typography>
                  </td>
                  <td>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Tooltip title="Copy as SpiceDB tuple">
                        <IconButton
                          size="sm"
                          variant="plain"
                          onClick={() => {
                            const tuple = `${rel.resource.type}:${rel.resource.id}#${rel.relation}@${formatSubject(rel.subject)}`;
                            navigator.clipboard.writeText(tuple);
                          }}
                        >
                          <LinkOutlined sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      {onDelete && (
                        <Tooltip title="Delete relationship">
                          <IconButton
                            size="sm"
                            variant="plain"
                            color="danger"
                            onClick={() => onDelete(rel)}
                          >
                            <DeleteOutlined sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Dropdown>
                        <MenuButton
                          slots={{ root: IconButton }}
                          slotProps={{ root: { size: "sm", variant: "plain" } }}
                        >
                          <MoreVertOutlined sx={{ fontSize: 16 }} />
                        </MenuButton>
                        <Menu size="sm">
                          <MenuItem
                            onClick={() => navigateToResource(rel.resource.type, rel.resource.id)}
                          >
                            View Resource
                          </MenuItem>
                          {!rel.subject.relation && (
                            <MenuItem
                              onClick={() => navigateToResource(rel.subject.type, rel.subject.id)}
                            >
                              View Subject
                            </MenuItem>
                          )}
                          <Divider />
                          <MenuItem
                            onClick={() => {
                              const tuple = `${rel.resource.type}:${rel.resource.id}#${rel.relation}@${formatSubject(rel.subject)}`;
                              navigator.clipboard.writeText(tuple);
                            }}
                          >
                            Copy Tuple
                          </MenuItem>
                          <MenuItem
                            onClick={() => {
                              const json = JSON.stringify(rel, null, 2);
                              navigator.clipboard.writeText(json);
                            }}
                          >
                            Copy as JSON
                          </MenuItem>
                        </Menu>
                      </Dropdown>
                    </Box>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Sheet>

      {filteredRelationships.length > 0 && (
        <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography level="body-xs" sx={{ color: "text.secondary" }}>
            Showing {filteredRelationships.length} of {relationships.length} relationships
          </Typography>
        </Box>
      )}
    </Box>
  );
}
