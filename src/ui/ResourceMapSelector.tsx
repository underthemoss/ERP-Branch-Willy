import { graphql } from "@/graphql";
import { useListResourceMapEntriesQuery } from "@/graphql/hooks";
import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import React from "react";

// GQL query for listing resource map entries
export const LIST_RESOURCE_MAP_ENTRIES = graphql(`
  query listResourceMapEntries {
    listResourceMapEntries {
      id
      value
      path
      parent_id
      children {
        id
      }
    }
  }
`);

export interface ResourceMapSelectorProps {
  resourceMapIds?: string[];
  onChange: (resourceMapIds: string[]) => void;
  label?: string;
}

// Helper to build a tree from flat data
function buildTree(
  entries: { id: string; value: string; parent_id: string; childCount: number }[],
  parentId: string = "",
): any[] {
  return entries
    .filter((entry) => entry.parent_id === parentId)
    .map((entry) => ({
      id: entry.id,
      label: entry.value + ` ${entry.childCount}`,
      children: buildTree(entries, entry.id),
    }));
}

// Helper to find label by id in the tree (recursive)
function findLabelById(id: string, nodes: any[]): string | undefined {
  for (const node of nodes) {
    if (node.id === id) return node.label;
    if (node.children) {
      const found = findLabelById(id, node.children);
      if (found) return found;
    }
  }
  return undefined;
}

export const ResourceMapSelector: React.FC<ResourceMapSelectorProps> = ({
  resourceMapIds = [],
  onChange,
  label = "Select resources…",
}) => {
  const { data, loading, error } = useListResourceMapEntriesQuery();

  // Build the tree from the query data
  const treeItems = React.useMemo(() => {
    if (!data?.listResourceMapEntries) return [];
    // Filter out nulls and provide default values for value/parent_id
    const sanitized = data.listResourceMapEntries.filter(Boolean).map((e) => ({
      id: e?.id || "",
      value: e?.value ?? "",
      parent_id: e?.parent_id ?? "",
      childCount: e?.children?.length || 0,
    }));
    return buildTree(sanitized);
  }, [data]);

  // Dialog open state
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Local selection state for dialog (so user can cancel)
  const [pendingSelection, setPendingSelection] = React.useState<string[]>(resourceMapIds);

  // Keep pendingSelection in sync with prop when dialog opens
  React.useEffect(() => {
    if (dialogOpen) {
      setPendingSelection(resourceMapIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen]);

  // Remove a selected id
  const handleDeleteChip = (idToRemove: string) => {
    onChange(resourceMapIds.filter((id) => id !== idToRemove));
  };

  // Open dialog
  const handleAddClick = () => {
    setDialogOpen(true);
  };

  // Open dialog when clicking the field (except add button or chip delete)
  const handleFieldClick = (e: React.MouseEvent) => {
    // If the click originated from a chip delete or the add button, ignore
    // (these will call stopPropagation in their handlers)
    setDialogOpen(true);
  };

  // Close dialog (cancel)
  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  // Save selection
  const handleDialogSave = () => {
    onChange(pendingSelection);
    setDialogOpen(false);
  };

  return (
    <Box>
      {label && (
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          {label}
        </Typography>
      )}
      <Paper
        variant="outlined"
        sx={{
          minHeight: 56,
          borderRadius: 1,
          display: "flex",
          alignItems: "center",
          px: 1,
          py: 0.5,
          flexWrap: "wrap",
          backgroundColor: "background.paper",
          position: "relative",
        }}
        data-testid="resource-map-selector2-field"
        onClick={handleFieldClick}
        tabIndex={0}
        role="button"
        aria-label="Open resource selector"
      >
        {resourceMapIds.length === 0 ? (
          <Typography color="text.secondary" sx={{ opacity: 0.7, flex: 1 }}>
            Select resources…
          </Typography>
        ) : (
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ flex: 1 }}>
            {resourceMapIds.map((id) => (
              <Chip
                key={id}
                label={findLabelById(id, treeItems) || id}
                onDelete={(e) => {
                  e.stopPropagation();
                  handleDeleteChip(id);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                size="small"
                sx={{ mb: 0.5 }}
              />
            ))}
          </Stack>
        )}
        <IconButton
          aria-label="Add resource"
          onClick={(e) => {
            e.stopPropagation();
            handleAddClick();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          size="small"
          sx={{ ml: 1 }}
        >
          <AddIcon />
        </IconButton>
      </Paper>
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Select Resources</DialogTitle>
        <DialogContent dividers sx={{ minHeight: 300 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : error ? (
            <Typography color="error">Failed to load resources</Typography>
          ) : (
            <RichTreeView
              multiSelect
              checkboxSelection
              items={treeItems}
              selectedItems={pendingSelection}
              onSelectedItemsChange={(_, ids) => {
                setPendingSelection(ids);
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleDialogSave} variant="contained" disabled={loading}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResourceMapSelector;
