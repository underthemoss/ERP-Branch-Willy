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
import {
  PimCategoryFields,
  PimProductFields,
  useListPimCategoriesQuery,
  useListPimProductsQuery,
} from "./api";

type TreeViewNode = Record<
  string,
  {
    id: string;
    label: string;
    path: string | null | undefined;
    nodeType: "category" | "product";
    children?: TreeViewNode;
    productId?: string;
  }
>;

type PimCategoryTreeViewItem = TreeViewBaseItem<{
  id: string;
  label: string;
  path: string | undefined;
  nodeType: "category" | "product";
  productId?: string;
}>;

function normalizeString(val: unknown): string | undefined {
  return typeof val === "string" ? val : undefined;
}

function getTreeItems(
  pimCategories: PimCategoryFields[],
  pimProducts: PimProductFields[],
  searchTerm?: string,
): PimCategoryTreeViewItem[] {
  const treeItemsMap: TreeViewNode = {};

  // Build category tree
  pimCategories.forEach((category) => {
    const { id, name, path } = category;
    const categoryPath = (path || "")
      .split("|")
      .map((s) => (s ?? "").trim())
      .filter((s) => !!s);

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
      if (!category || typeof category !== "string") return;
      partialPath += "|category";
      if (!currentLevel[category]) {
        currentLevel[category] = {
          id: `${id}-${index}`,
          label: category,
          children: {},
          path: partialPath,
          nodeType: "category",
        };
      }
      currentLevel = currentLevel[category].children as TreeViewNode;
    });

    if (!name || typeof name !== "string") return;
    currentLevel[name] = {
      id: id!,
      path: normalizeString(path),
      label: name,
      children: {},
      nodeType: "category",
    };
  });

  // Add products under their parent category
  pimProducts.forEach((product) => {
    const { id, name, pim_category_path } = product;
    if (!pim_category_path) return;

    // Filter by search term
    if (
      searchTerm &&
      name?.toLowerCase().includes(searchTerm) === false &&
      id?.toLowerCase().includes(searchTerm) === false
    ) {
      return;
    }

    const categoryPath = (pim_category_path || "")
      .split("|")
      .map((s) => (s ?? "").trim())
      .filter((s) => !!s);

    // Find the parent category object by matching the full path
    let parentCategoryId = "root";
    if (categoryPath.length > 0) {
      const parentPath = "|" + categoryPath.join("|") + "|";
      const parentCategory = pimCategories.find((cat) => cat.path === parentPath);
      if (parentCategory && parentCategory.id) {
        parentCategoryId = parentCategory.id;
      } else {
        // fallback: use the full path string to guarantee uniqueness
        parentCategoryId = "root:" + parentPath;
      }
    }
    const extendedPath = [...categoryPath, "__products__"];
    let currentLevel = treeItemsMap;
    extendedPath.forEach((category, index) => {
      if (!category || typeof category !== "string") return;
      // For the products group node, use a unique id based on parent category id
      let nodeId: string;
      if (category === "__products__") {
        nodeId = `products:${parentCategoryId}`;
      } else {
        nodeId = `catpath:${categoryPath.slice(0, index + 1).join("|")}`;
      }
      if (!currentLevel[category]) {
        currentLevel[category] = {
          id: nodeId,
          label: category === "__products__" ? "Products" : category,
          children: {},
          path: undefined, // unknown
          nodeType: "category",
        };
      }
      currentLevel = currentLevel[category].children as TreeViewNode;
    });

    // Add product as a leaf node
    if (!name || typeof name !== "string") return;
    currentLevel[name] = {
      id: `product-${id}`,
      path: normalizeString(pim_category_path),
      label: name,
      nodeType: "product",
    };
  });

  return flattenTree(treeItemsMap);
}

function flattenTree(map: TreeViewNode): PimCategoryTreeViewItem[] {
  return Object.values(map).map((node) => {
    const { id, label, nodeType, children } = node;
    return {
      id,
      label,
      nodeType,
      path: normalizeString(node.path),
      children: children ? flattenTree(children) : undefined,
    };
  });
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

export function PimCategoriesTreeView(props: {
  onItemSelected: (item: PimCategoryFields | PimProductFields) => void;
}) {
  const [pimSearch, setPimSearch] = React.useState<string | undefined>();
  const [searchInput, setSearchInput] = React.useState<string>("");
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  const [selectedItem, setSelectedItem] = React.useState<
    PimCategoryFields | PimProductFields | null
  >(null);
  const apiRef = useTreeViewApiRef();
  const { data, loading, error } = useListPimCategoriesQuery({
    variables: {
      page: {
        number: 0,
        size: 5000,
      },
    },
  });
  const {
    data: productsData,
    loading: productsLoading,
    error: productsError,
  } = useListPimProductsQuery({
    variables: {
      page: {
        number: 0,
        size: 5000,
      },
    },
  });

  const items = React.useMemo(() => {
    if (loading || productsLoading) {
      return [];
    }

    const pimItems = data?.listPimCategories?.items || [];
    const productItems = productsData?.listPimProducts?.items || [];
    // Only filter if at least 3 chars, otherwise show all
    if (pimSearch && pimSearch.length >= 3) {
      return getTreeItems(pimItems, productItems, pimSearch);
    }
    return getTreeItems(pimItems, productItems, undefined);
  }, [
    data?.listPimCategories?.items,
    productsData?.listPimProducts?.items,
    pimSearch,
    loading,
    productsLoading,
  ]);

  const handleCategorySelected = React.useCallback(
    (itemId: string) => {
      // Handle product selection
      if (itemId.startsWith("product-")) {
        const productId = itemId.replace("product-", "");
        const product =
          productsData?.listPimProducts?.items.find((p) => p.id === productId) || null;
        if (product) {
          setSelectedItem(product);
          props.onItemSelected(product);
          return product;
        }
        return;
      }

      // Handle category selection
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

      setSelectedItem(category);
      props.onItemSelected(category);
      return category;
    },
    [data?.listPimCategories?.items, productsData?.listPimProducts?.items, props],
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
    setSelectedItem(null);
    setPimSearch(undefined);
    setSearchInput("");
    setExpandedItems([]);
  };

  return (
    <Stack spacing={2}>
      {selectedItem && (
        <Paper variant="outlined" sx={{ p: 2, position: "relative" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 2,
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6">{selectedItem.name}</Typography>
            <IconButton onClick={handleClearSelection} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Typography variant="body2" color="grey.400" sx={{ mt: 0.5 }}>
            {selectedItem.__typename === "PimProduct"
              ? selectedItem.pim_category_path
              : selectedItem.__typename === "PimCategory"
                ? selectedItem.path
                : ""}
          </Typography>

          <Link
            href={
              selectedItem.__typename === "PimProduct"
                ? `/products/${selectedItem.id}`
                : `/categories/${selectedItem.id}`
            }
            target="_blank"
            sx={{ textDecoration: "none" }}
          >
            {selectedItem.__typename === "PimProduct" ? "View Product →" : "View Category →"}
          </Link>

          {/* Optionally render more product/category details here */}
        </Paper>
      )}
      {!selectedItem && (
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
