import * as links from "@/lib/links";
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
import { PimProductFields, useListPimProductsQuery } from "./api";

type TreeViewNode = Record<string, { id: string; label: string; children?: TreeViewNode }>;

function getTreeItems(pimProducts: PimProductFields[], searchTerm?: string): TreeViewBaseItem[] {
  const treeItemsMap: TreeViewNode = {};

  pimProducts.forEach((product) => {
    const { id, name, pim_category_path } = product;
    const categoryPath = pim_category_path!.split("|").filter(Boolean);

    if (
      searchTerm &&
      pim_category_path?.toLowerCase().includes(searchTerm) === false &&
      name?.toLowerCase().includes(searchTerm) === false &&
      id?.toLowerCase().includes(searchTerm) === false
    ) {
      return;
    }

    let currentLevel = treeItemsMap;
    let path = "";

    categoryPath.forEach((category, index) => {
      path += `|${category}`;
      if (!currentLevel[category]) {
        currentLevel[category] = {
          id: path,
          label: category,
          children: {},
        };
      }
      currentLevel = currentLevel[category].children as TreeViewNode;
    });

    currentLevel[id as string] = {
      id: id!,
      label: name!,
    };
  });

  return flattenTree(treeItemsMap);
}

function flattenTree(map: TreeViewNode): TreeViewBaseItem[] {
  return Object.values(map).map((node) => ({
    ...node,
    children: node.children ? flattenTree(node.children) : undefined,
  }));
}

function getExpandedNodeIdsForSearch(items: TreeViewBaseItem[], search: string): string[] {
  const expandedIds = new Set<string>();
  const term = search.trim().toLowerCase();

  function traverse(nodes: TreeViewBaseItem[], path: string[] = []) {
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

export function PimProductsTreeView(props: { onProductSelected: (productId: string) => void }) {
  const [pimSearch, setPimSearch] = React.useState<string | undefined>();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = React.useState<PimProductFields | null>(null);
  const apiRef = useTreeViewApiRef();
  const { data, loading, error } = useListPimProductsQuery({
    variables: {
      page: {
        number: 0,
        size: 3000,
      },
    },
  });

  const items = React.useMemo(() => {
    const pimItems = data?.listPimProducts?.items || [];
    return getTreeItems(pimItems, pimSearch);
  }, [data?.listPimProducts?.items, pimSearch]);

  const handleProductSelected = React.useCallback(
    (itemId: string) => {
      const product = data?.listPimProducts?.items.find((p) => p.id === itemId);
      if (product) {
        setSelectedProduct(product);
        props.onProductSelected(itemId);
        return product;
      }
    },
    [data?.listPimProducts?.items, props],
  );

  React.useEffect(() => {
    if (pimSearch) {
      // check if the search term is a valid product ID
      const isProduct = handleProductSelected(pimSearch);
      if (isProduct) {
        return;
      }

      const idsToExpand = getExpandedNodeIdsForSearch(items, pimSearch);
      setExpandedItems(idsToExpand);
    } else {
      setExpandedItems([]);
    }
  }, [items, pimSearch, apiRef, handleProductSelected]);

  const handleClearSelection = () => {
    setSelectedProduct(null);
    setPimSearch(undefined);
    setExpandedItems([]);
  };

  return (
    <Stack spacing={2}>
      {selectedProduct && (
        <Paper variant="outlined" sx={{ p: 2, position: "relative" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 2,
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6">{selectedProduct.name}</Typography>
            <IconButton onClick={handleClearSelection} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Typography variant="body2" color="grey.400" sx={{ mt: 0.5 }}>
            {selectedProduct.pim_category_path}
          </Typography>
          {selectedProduct.id && (
            <Link
              href={links.getPimProductUrl(selectedProduct.id!)}
              target="_blank"
              sx={{ textDecoration: "none" }}
            >
              View Product →
            </Link>
          )}
        </Paper>
      )}
      {!selectedProduct && (
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
              onItemClick={(event, itemId) => handleProductSelected(itemId)}
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
