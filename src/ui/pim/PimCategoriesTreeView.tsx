import CloseIcon from "@mui/icons-material/Close";
import { Divider, TextField, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { TreeItem, TreeItemProps } from "@mui/x-tree-view";
import { useTreeViewApiRef } from "@mui/x-tree-view/hooks";
import { TreeViewBaseItem } from "@mui/x-tree-view/models";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import * as React from "react";
import { PimCategoryFields, useListPimCategoriesQuery } from "./api";

type TreeViewNode = Record<
  string,
  { id: string; label: string; path: string; children?: TreeViewNode }
>;

type PimCategoryTreeViewItem = TreeViewBaseItem<{ id: string; label: string; path: string }>;

function getTreeItems(
  pimCategories: PimCategoryFields[],
  searchTerm?: string,
): PimCategoryTreeViewItem[] {
  const treeItemsMap: TreeViewNode = {};

  pimCategories.forEach((category) => {
    const { id, name, path } = category;
    const categoryPath = path!.split("|").filter(Boolean);

    if (
      searchTerm &&
      path?.toLowerCase().includes(searchTerm) === false &&
      name?.toLowerCase().includes(searchTerm) === false &&
      id?.toLowerCase().includes(searchTerm) === false
    ) {
      return;
    }

    let currentLevel = treeItemsMap;
    let partialPath = "";
    categoryPath.forEach((category, index) => {
      partialPath += "|category"; // accumulate the path
      if (!currentLevel[category]) {
        currentLevel[category] = {
          id: `${id}-${index}`, // avoid conficts, but will be replaced in the next step
          label: category,
          children: {},
          path: partialPath,
        };
      }
      currentLevel = currentLevel[category].children as TreeViewNode;
    });

    currentLevel[name] = {
      id: id!,
      path: path!,
      label: name!,
      children: {},
    };
  });

  return flattenTree(treeItemsMap);
}

function flattenTree(map: TreeViewNode): PimCategoryTreeViewItem[] {
  return Object.values(map).map((node) => ({
    ...node,
    children: node.children ? flattenTree(node.children) : undefined,
  }));
}

function getExpandedNodeIdsForSearch(items: PimCategoryTreeViewItem[], search: string): string[] {
  const expandedIds = new Set<string>();
  const term = search.trim().toLowerCase();

  function traverse(nodes: PimCategoryTreeViewItem[], path: string[] = []) {
    for (const node of nodes) {
      const isMatch =
        node.label.toLowerCase().includes(term) || node.id.toLowerCase().includes(term);
      const hasMatchingChild = node.children && traverse(node.children, [...path, node.id]);

      if (isMatch || hasMatchingChild) {
        for (const ancestor of path) {
          expandedIds.add(ancestor); // expand the path to this match
        }
      }
    }
    return false; // needed to satisfy `hasMatchingChild` logic
  }

  traverse(items);
  return Array.from(expandedIds);
}

interface CustomLabelProps {
  children: string;
  className: string;
  searchTerm?: string;
}

function CustomLabel({ children, className, searchTerm = "" }: CustomLabelProps) {
  const index = children.toLowerCase().indexOf(searchTerm.toLowerCase());

  if (!searchTerm || index === -1) {
    return (
      <div className={className}>
        <Typography>{children}</Typography>
      </div>
    );
  }

  return (
    <div className={className}>
      {children.slice(0, index)}
      <span style={{ backgroundColor: "yellow", fontWeight: "bold" }}>
        {children.slice(index, index + searchTerm.length)}
      </span>
      {children.slice(index + searchTerm.length)}
    </div>
  );
}

type CustomTreeItemProps = TreeItemProps & { searchTerm?: string };

const CustomTreeItem = React.forwardRef(function CustomTreeItem(
  props: CustomTreeItemProps,
  ref: React.Ref<HTMLLIElement>,
) {
  return (
    <TreeItem
      {...props}
      ref={ref}
      slots={{
        label: CustomLabel,
      }}
      slotProps={{
        label: { searchTerm: props.searchTerm } as CustomLabelProps,
      }}
    />
  );
});

export function PimCategoriesTreeView(props: { onItemSelected: (categoryId: string) => void }) {
  const [pimSearch, setPimSearch] = React.useState<string | undefined>();
  const [searchInput, setSearchInput] = React.useState<string>("");
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<PimCategoryFields | null>(null);
  const apiRef = useTreeViewApiRef();
  const { data, loading, error } = useListPimCategoriesQuery({
    variables: {
      page: {
        number: 0,
        size: 5000,
      },
    },
  });

  const items = React.useMemo(() => {
    const pimItems = data?.listPimCategories?.items || [];
    // Only filter if at least 3 chars, otherwise show all
    if (pimSearch && pimSearch.length >= 3) {
      return getTreeItems(pimItems, pimSearch);
    }
    return getTreeItems(pimItems, undefined);
  }, [data?.listPimCategories?.items, pimSearch]);

  const handleCategorySelected = React.useCallback(
    (itemId: string) => {
      const category = data?.listPimCategories?.items.find((c) => c.id === itemId);

      if (!category) {
        return;
      }

      const hasChildren = data?.listPimCategories?.items.some((c) => {
        const expectedPath = category.path
          ? `${category.path}${category?.name}|`
          : `|${category?.name}|`;
        const match = c.path === expectedPath;

        return match;
      });

      if (hasChildren) {
        return;
      }

      setSelectedCategory(category);
      props.onItemSelected(itemId);
      return category;
    },
    [data?.listPimCategories?.items, props],
  );

  // Debounce search input and update pimSearch only if >= 3 chars
  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput && searchInput.length >= 3) {
        setPimSearch(searchInput.toLowerCase());
      } else {
        setPimSearch(undefined);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  React.useEffect(() => {
    if (pimSearch && pimSearch.length >= 3) {
      // check if the search term is a valid category ID
      const isCategory = handleCategorySelected(pimSearch);
      if (isCategory) {
        return;
      }

      const idsToExpand = getExpandedNodeIdsForSearch(items, pimSearch);
      setExpandedItems(idsToExpand);
    } else {
      setExpandedItems([]);
    }
  }, [items, pimSearch, apiRef, handleCategorySelected]);

  const handleClearSelection = () => {
    setSelectedCategory(null);
    setPimSearch(undefined);
    setSearchInput("");
    setExpandedItems([]);
  };

  return (
    <Stack spacing={2}>
      {selectedCategory && (
        <Paper variant="outlined" sx={{ p: 2, position: "relative" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 2,
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6">{selectedCategory.name}</Typography>
            <IconButton onClick={handleClearSelection} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Typography variant="body2" color="grey.400" sx={{ mt: 0.5 }}>
            {selectedCategory.path}
          </Typography>

          <Link
            href={`/categories/${selectedCategory.id}`}
            target="_blank"
            sx={{ textDecoration: "none" }}
          >
            View Category →
          </Link>
        </Paper>
      )}
      {!selectedCategory && (
        <Box>
          <TextField
            fullWidth
            placeholder="Enter at least 3 characters to search categories"
            sx={{ mb: 2 }}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            slotProps={{
              htmlInput: {
                minLength: 3,
              },
            }}
          />
          <Typography variant="body2" color="text.secondary" mb={2}>
            Enter at least 3 characters to search for a category by name or use the tree view to
            navigate through them.
          </Typography>
          <Box>
            {loading && <Typography>Loading...</Typography>}
            {error && <Typography color="error">Error loading categories</Typography>}
            <RichTreeView
              items={items}
              apiRef={apiRef}
              expandedItems={expandedItems}
              onExpandedItemsChange={(event, itemIds) => setExpandedItems(itemIds)}
              onItemClick={(event, itemId) => handleCategorySelected(itemId)}
              slots={{ item: CustomTreeItem }}
              slotProps={{
                item: {
                  searchTerm: pimSearch,
                } as CustomTreeItemProps,
              }}
            />
          </Box>
          <Divider sx={{ my: 2 }} />
        </Box>
      )}
    </Stack>
  );
}
