"use client";

import { graphql } from "@/graphql";
import {
  useAddSearchRecentMutation,
  useGetSearchUserStateQuery,
  useRemoveSearchRecentMutation,
  useSearchDocumentsQuery,
  useToggleSearchFavoriteMutation,
} from "@/graphql/hooks";
import { useSelectedWorkspaceId } from "@/providers/WorkspaceProvider";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import SearchIcon from "@mui/icons-material/Search";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

// GraphQL queries - needed for codegen
const SEARCH_DOCUMENTS_QUERY = graphql(`
  query SearchDocuments(
    $workspaceId: String!
    $searchText: String
    $collections: [SearchableCollectionType!]
    $page: Int
    $pageSize: Int
  ) {
    searchDocuments(
      workspaceId: $workspaceId
      searchText: $searchText
      collections: $collections
      page: $page
      pageSize: $pageSize
    ) {
      documents {
        id
        documentId
        collection
        documentType
        title
        subtitle
        metadata
        createdAt
        updatedAt
        workspaceId
      }
      page {
        number
        size
        totalItems
        totalPages
      }
      total
    }
  }
`);

const GET_SEARCH_USER_STATE_QUERY = graphql(`
  query GetSearchUserState($workspaceId: String!) {
    getSearchUserState(workspaceId: $workspaceId) {
      id
      userId
      workspaceId
      favorites {
        searchDocumentId
        addedAt
        searchDocument {
          id
          documentId
          collection
          documentType
          title
          subtitle
          metadata
          createdAt
          updatedAt
          workspaceId
        }
      }
      recents {
        searchDocumentId
        accessedAt
        searchDocument {
          id
          documentId
          collection
          documentType
          title
          subtitle
          metadata
          createdAt
          updatedAt
          workspaceId
        }
      }
      createdAt
      updatedAt
    }
  }
`);

const TOGGLE_SEARCH_FAVORITE_MUTATION = graphql(`
  mutation ToggleSearchFavorite($workspaceId: String!, $searchDocumentId: String!) {
    toggleSearchFavorite(workspaceId: $workspaceId, searchDocumentId: $searchDocumentId) {
      id
      favorites {
        searchDocumentId
        addedAt
      }
      recents {
        searchDocumentId
        accessedAt
      }
    }
  }
`);

const ADD_SEARCH_RECENT_MUTATION = graphql(`
  mutation AddSearchRecent($workspaceId: String!, $searchDocumentId: String!) {
    addSearchRecent(workspaceId: $workspaceId, searchDocumentId: $searchDocumentId) {
      id
      favorites {
        searchDocumentId
        addedAt
      }
      recents {
        searchDocumentId
        accessedAt
      }
    }
  }
`);

const REMOVE_SEARCH_RECENT_MUTATION = graphql(`
  mutation RemoveSearchRecent($workspaceId: String!, $searchDocumentId: String!) {
    removeSearchRecent(workspaceId: $workspaceId, searchDocumentId: $searchDocumentId) {
      id
      favorites {
        searchDocumentId
        addedAt
      }
      recents {
        searchDocumentId
        accessedAt
      }
    }
  }
`);

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

const COLLECTION_LABELS: Record<string, string> = {
  assets: "Asset",
  contacts: "Contact",
  inventory: "Inventory",
  invoices: "Invoice",
  projects: "Project",
  purchase_orders: "PO",
  sales_orders: "SO",
};

const COLLECTION_ROUTES: Record<string, (workspaceId: string, id: string) => string> = {
  contacts: (workspaceId, id) => `/app/${workspaceId}/contacts/${id}`,
  inventory: (workspaceId, id) => `/app/${workspaceId}/inventory/${id}`,
  invoices: (workspaceId, id) => `/app/${workspaceId}/invoices/${id}`,
  projects: (workspaceId, id) => `/app/${workspaceId}/projects/${id}`,
  purchase_orders: (workspaceId, id) => `/app/${workspaceId}/purchase-orders/${id}`,
  sales_orders: (workspaceId, id) => `/app/${workspaceId}/sales-orders/${id}`,
};

export const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose }) => {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const workspaceId = useSelectedWorkspaceId();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load user's search state from backend (includes searchDocument data)
  const { data: userStateData, loading: userStateLoading } = useGetSearchUserStateQuery({
    variables: {
      workspaceId: workspaceId || "",
    },
    skip: !workspaceId || !open,
    fetchPolicy: "cache-and-network",
  });

  // Mutations
  const [toggleFavorite] = useToggleSearchFavoriteMutation();
  const [addRecent] = useAddSearchRecentMutation();
  const [removeRecent] = useRemoveSearchRecentMutation();

  // Extract IDs and documents from user state
  const favoriteIds = useMemo(() => {
    return userStateData?.getSearchUserState?.favorites.map((f) => f.searchDocumentId) || [];
  }, [userStateData]);

  const recentIds = useMemo(() => {
    return userStateData?.getSearchUserState?.recents.map((r) => r.searchDocumentId) || [];
  }, [userStateData]);

  // Extract search documents from user state (no separate bulk query needed!)
  const favoriteDocuments = useMemo(() => {
    return (
      userStateData?.getSearchUserState?.favorites
        .map((f) => f.searchDocument)
        .filter((doc) => doc != null) || []
    );
  }, [userStateData]);

  const recentDocuments = useMemo(() => {
    return (
      userStateData?.getSearchUserState?.recents
        .map((r) => r.searchDocument)
        .filter((doc) => doc != null) || []
    );
  }, [userStateData]);

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSearchText("");
      setDebouncedSearchText("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const { data, loading } = useSearchDocumentsQuery({
    variables: {
      workspaceId: workspaceId || "",
      searchText: debouncedSearchText || undefined,
      pageSize: 50,
    },
    skip: !workspaceId || !open || debouncedSearchText.length === 0,
    fetchPolicy: "cache-and-network",
  });

  const searchResults = useMemo(() => {
    return data?.searchDocuments?.documents || [];
  }, [data]);

  // Convert favorite and recent documents to map for easy lookup
  const documentsById = useMemo(() => {
    const map = new Map();
    favoriteDocuments.forEach((doc) => {
      if (doc) map.set(doc.id, doc);
    });
    recentDocuments.forEach((doc) => {
      if (doc) map.set(doc.id, doc);
    });
    return map;
  }, [favoriteDocuments, recentDocuments]);

  const handleResultClick = useCallback(
    async (searchDocumentId: string, documentId: string, collection: string) => {
      const routeFn = COLLECTION_ROUTES[collection];
      if (routeFn && workspaceId) {
        // Add to recent searches (backend handles deduplication)
        try {
          await addRecent({
            variables: {
              workspaceId,
              searchDocumentId,
            },
          });
        } catch (error) {
          console.error("Failed to add to recent searches:", error);
        }

        // Navigate
        const route = routeFn(workspaceId, documentId);
        router.push(route);
        onClose();
      }
    },
    [router, onClose, workspaceId, addRecent],
  );

  const handleToggleFavorite = useCallback(
    async (e: React.MouseEvent, searchDocumentId: string) => {
      e.stopPropagation();
      if (!workspaceId) return;

      try {
        await toggleFavorite({
          variables: {
            workspaceId,
            searchDocumentId,
          },
        });
        // Refocus input to maintain keyboard navigation
        inputRef.current?.focus();
      } catch (error) {
        console.error("Failed to toggle favorite:", error);
      }
    },
    [workspaceId, toggleFavorite],
  );

  const handleRemoveFromRecent = useCallback(
    async (e: React.MouseEvent, searchDocumentId: string) => {
      e.stopPropagation();
      if (!workspaceId) return;

      try {
        await removeRecent({
          variables: {
            workspaceId,
            searchDocumentId,
          },
        });
        // Refocus input to maintain keyboard navigation
        inputRef.current?.focus();
      } catch (error) {
        console.error("Failed to remove from recent searches:", error);
      }
    },
    [workspaceId, removeRecent],
  );

  // Check if item is favorited
  const isFavorited = useCallback(
    (searchDocumentId: string) => {
      return favoriteIds.includes(searchDocumentId);
    },
    [favoriteIds],
  );

  // Combine all items for keyboard navigation
  const allItems = useMemo(() => {
    if (debouncedSearchText.length > 0) {
      // Searching - show search results
      return searchResults.map((r) => ({
        id: r.id,
        documentId: r.documentId,
        collection: r.collection,
        title: r.title,
        subtitle: r.subtitle || undefined,
        type: "search" as const,
      }));
    } else {
      // Not searching - show favorites and recent
      const favItems = favoriteIds
        .map((id) => {
          const doc = documentsById.get(id);
          return doc
            ? {
                id: doc.id,
                documentId: doc.documentId,
                collection: doc.collection,
                title: doc.title,
                subtitle: doc.subtitle || undefined,
                type: "favorite" as const,
              }
            : null;
        })
        .filter(Boolean);

      const recentItems = recentIds
        .map((id) => {
          const doc = documentsById.get(id);
          return doc
            ? {
                id: doc.id,
                documentId: doc.documentId,
                collection: doc.collection,
                title: doc.title,
                subtitle: doc.subtitle || undefined,
                type: "recent" as const,
              }
            : null;
        })
        .filter(Boolean);

      return [...favItems, ...recentItems] as Array<{
        id: string;
        documentId: string;
        collection: string;
        title: string;
        subtitle?: string;
        type: "favorite" | "recent";
      }>;
    }
  }, [debouncedSearchText, searchResults, favoriteIds, recentIds, documentsById]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!allItems.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, allItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = allItems[selectedIndex];
        if (selected) {
          handleResultClick(selected.id, selected.documentId, selected.collection);
        }
      }
    },
    [allItems, selectedIndex, handleResultClick],
  );

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedElement = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`,
      ) as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  const isSearching = debouncedSearchText.length > 0;
  const hasSearchResults = searchResults.length > 0;
  const hasFavorites = favoriteIds.length > 0 && favoriteIds.some((id) => documentsById.has(id));
  const hasRecent = recentIds.length > 0 && recentIds.some((id) => documentsById.has(id));

  const renderItem = (item: (typeof allItems)[0], index: number) => {
    const isSelected = index === selectedIndex;
    const itemIsFavorited = isFavorited(item.id);

    return (
      <Box
        key={`${item.type}_${item.id}`}
        data-index={index}
        onClick={() => handleResultClick(item.id, item.documentId, item.collection)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 1.5,
          mb: 1,
          bgcolor: isSelected ? "#e3f2fd" : "white",
          borderRadius: 2,
          border: "1px solid",
          borderColor: isSelected ? "primary.main" : "#e0e0e0",
          cursor: "pointer",
          transition: "all 0.2s",
          "&:hover": {
            bgcolor: isSelected ? "#e3f2fd" : "#f5f5f5",
            borderColor: isSelected ? "primary.main" : "#bdbdbd",
          },
        }}
      >
        {/* Icon - Different based on item type */}
        {item.type === "favorite" && <StarIcon sx={{ color: "primary.main", fontSize: 20 }} />}
        {item.type === "recent" && <HistoryIcon sx={{ color: "#9e9e9e", fontSize: 20 }} />}
        {item.type === "search" && <SearchIcon sx={{ color: "#9e9e9e", fontSize: 20 }} />}

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: "#212121",
              mb: 0.25,
            }}
          >
            {item.title}
          </Typography>
          {item.subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: "#757575",
                display: "block",
              }}
            >
              {item.subtitle}
            </Typography>
          )}
        </Box>

        {/* Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton
            size="small"
            sx={{
              color: itemIsFavorited ? "primary.main" : "#9e9e9e",
              "&:hover": { color: "primary.main" },
            }}
            onClick={(e) => handleToggleFavorite(e, item.id)}
          >
            {itemIsFavorited ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
          </IconButton>
          {item.type === "recent" && (
            <IconButton
              size="small"
              sx={{
                color: "#9e9e9e",
                "&:hover": { color: "error.main" },
              }}
              onClick={(e) => handleRemoveFromRecent(e, item.id)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
          <Chip
            label={COLLECTION_LABELS[item.collection] || item.collection}
            size="small"
            sx={{
              height: 24,
              fontSize: "0.7rem",
              fontWeight: 500,
              bgcolor: "#f0f0f0",
              color: "#616161",
              "& .MuiChip-label": {
                px: 1.5,
              },
            }}
          />
        </Box>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "80vh",
          height: "600px",
          bgcolor: "#f8f9fa",
        },
      }}
    >
      <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Search Input */}
        <Box sx={{ p: 2.5, bgcolor: "white" }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            placeholder="What are you looking for?"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "primary.main" }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Chip
                    label="esc"
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: "0.75rem",
                      bgcolor: "#f0f0f0",
                      "& .MuiChip-label": {
                        px: 1,
                      },
                    }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "white",
                "& fieldset": {
                  borderColor: "#e0e0e0",
                },
                "&:hover fieldset": {
                  borderColor: "#bdbdbd",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main",
                  borderWidth: 1,
                },
              },
            }}
          />
        </Box>

        {/* Results Area */}
        <Box ref={listRef} sx={{ flex: 1, overflow: "auto", p: 2.5, pb: 1 }}>
          {(loading || userStateLoading) && (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress size={40} />
            </Box>
          )}

          {/* Search Results */}
          {!loading && isSearching && !hasSearchResults && (
            <Box sx={{ textAlign: "center", p: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No results found for &ldquo;{debouncedSearchText}&rdquo;
              </Typography>
            </Box>
          )}

          {!loading && isSearching && hasSearchResults && (
            <Box>
              <Typography
                variant="overline"
                sx={{
                  display: "block",
                  color: "#757575",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  mb: 2,
                  letterSpacing: "0.5px",
                }}
              >
                RESULTS
              </Typography>
              {allItems.map((item, index) => renderItem(item, index))}
            </Box>
          )}

          {/* Favorites and Recent (when not searching) */}
          {!loading && !userStateLoading && !isSearching && (
            <>
              {/* Favorites Section */}
              {hasFavorites && (
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="overline"
                    sx={{
                      display: "block",
                      color: "#757575",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      mb: 2,
                      letterSpacing: "0.5px",
                    }}
                  >
                    FAVORITES
                  </Typography>
                  {allItems
                    .filter((item) => item.type === "favorite")
                    .map((item, index) => renderItem(item, index))}
                </Box>
              )}

              {/* Recent Section */}
              {hasRecent && (
                <Box>
                  <Typography
                    variant="overline"
                    sx={{
                      display: "block",
                      color: "#757575",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      mb: 2,
                      letterSpacing: "0.5px",
                    }}
                  >
                    RECENT
                  </Typography>
                  {allItems
                    .filter((item) => item.type === "recent")
                    .map((item) => {
                      // Find the actual index in allItems array
                      const actualIndex = allItems.findIndex((i) => i.id === item.id);
                      return renderItem(item, actualIndex);
                    })}
                </Box>
              )}

              {/* Empty State */}
              {!hasFavorites && !hasRecent && (
                <Box sx={{ textAlign: "center", p: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Start typing to search across projects, contacts, invoices, and more...
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>

        {/* Footer with Keyboard Shortcuts */}
        <Box
          sx={{
            p: 1.5,
            borderTop: "1px solid",
            borderColor: "#e0e0e0",
            bgcolor: "white",
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Chip
              label="↑↓"
              size="small"
              sx={{
                height: 20,
                fontSize: "0.7rem",
                bgcolor: "#f5f5f5",
                border: "1px solid #e0e0e0",
                "& .MuiChip-label": { px: 0.75 },
              }}
            />
            <Typography variant="caption" sx={{ color: "#616161", fontSize: "0.75rem" }}>
              to navigate
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Chip
              label="↵"
              size="small"
              sx={{
                height: 20,
                fontSize: "0.7rem",
                bgcolor: "#f5f5f5",
                border: "1px solid #e0e0e0",
                "& .MuiChip-label": { px: 0.75 },
              }}
            />
            <Typography variant="caption" sx={{ color: "#616161", fontSize: "0.75rem" }}>
              to select
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Chip
              label="esc"
              size="small"
              sx={{
                height: 20,
                fontSize: "0.7rem",
                bgcolor: "#f5f5f5",
                border: "1px solid #e0e0e0",
                "& .MuiChip-label": { px: 0.75 },
              }}
            />
            <Typography variant="caption" sx={{ color: "#616161", fontSize: "0.75rem" }}>
              to close
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
