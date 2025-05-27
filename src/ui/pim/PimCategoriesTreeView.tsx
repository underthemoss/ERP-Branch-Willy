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
  pimProducts: PimCategoryFields[],
  searchTerm?: string,
): PimCategoryTreeViewItem[] {
  const treeItemsMap: TreeViewNode = {};

  pimProducts.forEach((product) => {
    const { id, name, path } = product;
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

  console.log("Tree items map:", treeItemsMap);

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

function CustomLabel({ children, className, searchTerm }: CustomLabelProps) {
  if (!searchTerm) {
    return (
      <div className={className}>
        <Typography>{children}</Typography>
      </div>
    );
  }

  const index = children.toLowerCase().indexOf(searchTerm.toLowerCase());

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
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<PimCategoryFields | null>(null);
  const apiRef = useTreeViewApiRef();
  const { data, loading, error } = useListPimCategoriesQuery({
    variables: {
      page: {
        number: 0,
        size: 3000,
      },
    },
  });

  const items = React.useMemo(() => {
    const pimItems = data?.listPimCategories?.items || [];
    return getTreeItems(pimItems, pimSearch);
  }, [data?.listPimCategories?.items, pimSearch]);

  const handleCategorySelected = React.useCallback(
    (itemId: string) => {
      const category = data?.listPimCategories?.items.find((c) => c.id === itemId);

      if (!category) {
        return;
      }

      const hasChildren = data?.listPimCategories?.items.some((c) =>
        c.path.includes(category?.name),
      );

      if (hasChildren) {
        return;
      }

      setSelectedCategory(category);
      props.onItemSelected(itemId);
      return category;
    },
    [data?.listPimCategories?.items, props],
  );

  React.useEffect(() => {
    if (pimSearch) {
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
            placeholder="Search by name, category or product ID"
            sx={{ mb: 2 }}
            onChange={(e) => setPimSearch(e.target.value.toLowerCase())}
          />
          <Typography variant="body2" color="text.secondary" mb={2}>
            Search for a product by name or category or use the tree view to navigate through
            categories.
          </Typography>
          <Box>
            {loading && <Typography>Loading...</Typography>}
            {error && <Typography color="error">Error loading products</Typography>}
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
