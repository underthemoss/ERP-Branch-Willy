import CloseIcon from "@mui/icons-material/Close";
import { Divider, TextField, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { TreeItem, TreeItemProps } from "@mui/x-tree-view";
import { RichTreeViewPro } from "@mui/x-tree-view-pro";
import { useTreeViewApiRef } from "@mui/x-tree-view/hooks";
import { TreeViewBaseItem } from "@mui/x-tree-view/models";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import { get, set } from "lodash";
import * as React from "react";
import {
  PimCategoryFields,
  PimProductFields,
  useListPimCategoriesLazyQuery,
  useListPimProductsLazyQuery,
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
    childrenCount?: number;
    productCount?: number;
    pimItem?: PimCategoryFields | PimProductFields;
  }
>;

type PimCategoryTreeViewItem = TreeViewBaseItem<{
  id: string;
  label: string;
  path: string | undefined;
  nodeType: "category" | "product";
  productId?: string;
  childrenCount?: number;
  productCount?: number;
  pimItem?: PimCategoryFields | PimProductFields;
}>;

function normalizeString(val: unknown): string | undefined {
  return typeof val === "string" ? val : undefined;
}

function getTreeItems(opts: {
  pimCategories: PimCategoryFields[];
  pimProducts: PimProductFields[];
  searchTerm?: string;
}): PimCategoryTreeViewItem[] {
  const { pimCategories, pimProducts, searchTerm } = opts;
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

    categoryPath.forEach((categoryName, index) => {
      if (!categoryName || typeof categoryName !== "string") return;
      partialPath += "|category";
      if (!currentLevel[categoryName]) {
        currentLevel[categoryName] = {
          id: `${id}-${index}`,
          label: categoryName,
          children: {},
          path: partialPath,
          nodeType: "category",
        };
      }
      currentLevel = currentLevel[categoryName].children as TreeViewNode;
    });

    if (!name || typeof name !== "string") return;
    currentLevel[name] = {
      id: id!,
      path: normalizeString(path),
      label: name,
      children: {},
      nodeType: "category",
      pimItem: category,
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
      id: `product:${id}`,
      path: normalizeString(pim_category_path),
      label: name,
      nodeType: "product",
      pimItem: product,
    };
  });

  return flattenTree(treeItemsMap);
}

function flattenTree(map: TreeViewNode): PimCategoryTreeViewItem[] {
  return Object.values(map).map((node) => {
    const { children, ...otherFields } = node;
    return {
      ...otherFields,
      children: children ? flattenTree(children) : undefined,
    } as PimCategoryTreeViewItem;
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
  const [searchResults, setSearchResults] = React.useState<PimCategoryTreeViewItem[]>([]);
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  const [searchInput, setSearchInput] = React.useState<string>("");
  const [selectedItem, setSelectedItem] = React.useState<
    PimCategoryFields | PimProductFields | null
  >(null);
  const apiRef = useTreeViewApiRef();

  const [listCategoriesQuery, { loading: categoriesLoading, error: categoriesError }] =
    useListPimCategoriesLazyQuery();
  const [listProductsQuery, { loading: productsLoading, error: productsError }] =
    useListPimProductsLazyQuery();

  const loading = categoriesLoading || productsLoading;
  const error = categoriesError || productsError;

  const getItemsForParent = React.useCallback(
    async (opts: { parentCategoryId?: string }): Promise<PimCategoryTreeViewItem[]> => {
      const item: PimCategoryTreeViewItem | null = opts.parentCategoryId
        ? apiRef.current?.getItem(opts.parentCategoryId)
        : null;

      if (opts.parentCategoryId?.startsWith("products:")) {
        const parentCategoryId = opts.parentCategoryId.replace("products:", "");
        const { error: productsError, data: productsData } = await listProductsQuery({
          variables: {
            filter: {
              pimCategoryPlatformId: parentCategoryId,
            },
            page: {
              size: item?.productCount,
            },
          },
        });

        if (productsError) {
          return [];
        }
        const productItems = productsData?.listPimProducts?.items || [];
        return productItems.map((product) => ({
          id: `product:${product.id}`,
          label: product.name ?? "",
          nodeType: "product",
          path: product.pim_category_path ?? "",
          productId: product.id ?? "",
          children: [],
          pimItem: product,
        }));
      } else {
        const parentCategoryId = opts.parentCategoryId || "";
        const { error, data } = await listCategoriesQuery({
          variables: {
            filter: {
              parentId: parentCategoryId,
            },
            page: {
              size: item?.childrenCount ?? 500,
            },
          },
        });

        if (error) {
          return [];
        }

        const categoryItems = data?.listPimCategories?.items || [];
        const treeItems: PimCategoryTreeViewItem[] = categoryItems.map((category) => ({
          id: category.id,
          label: category.name ?? "",
          nodeType: "category",
          path: category.path,
          children: [],
          childrenCount: category.childrenCount ?? 0,
          productCount: category.productCount ?? 0,
          pimItem: category,
        }));

        if (item?.productCount) {
          // inject a product tree item
          treeItems.unshift({
            id: `products:${item?.id}`,
            label: "Products",
            nodeType: "category",
            path: "",
            children: [],
            childrenCount: item?.productCount ?? 0,
            productCount: 0,
          });
        }

        return treeItems as PimCategoryTreeViewItem[];
      }
    },
    [listCategoriesQuery, listProductsQuery, apiRef],
  );

  const handleItemClicked = React.useCallback(
    (itemId: string) => {
      const item: PimCategoryTreeViewItem = apiRef.current?.getItem(itemId);

      if (item?.childrenCount || item?.productCount) {
        return;
      }

      if (item.pimItem) {
        setSelectedItem(item.pimItem);
        props.onItemSelected(item.pimItem);
        return item.pimItem;
      }
    },
    [props, apiRef],
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

  const fetchDataForSearchTerm = React.useCallback(
    async (searchTerm: string) => {
      const [categoriesData, productsData] = await Promise.all([
        listCategoriesQuery({
          variables: {
            filter: {
              searchTerm,
            },
            page: {
              size: 500,
            },
          },
        }),
        listProductsQuery({
          variables: {
            filter: {
              searchTerm,
            },
            page: {
              size: 500,
            },
          },
        }),
      ]);
      const items = getTreeItems({
        pimCategories: categoriesData?.data?.listPimCategories?.items || [],
        pimProducts: productsData?.data?.listPimProducts?.items || [],
        searchTerm,
      });
      setSearchResults(items);
      const idsToExpand = getExpandedNodeIdsForSearch(items, searchTerm);
      setExpandedItems(idsToExpand);
    },

    [listCategoriesQuery, listProductsQuery],
  );

  React.useEffect(() => {
    if (pimSearch && pimSearch.length >= 3) {
      fetchDataForSearchTerm(pimSearch);
    } else {
      setExpandedItems([]);
      setSearchResults([]);
    }
  }, [pimSearch, apiRef, handleItemClicked, fetchDataForSearchTerm]);

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
            {loading && pimSearch && <Typography>Loading...</Typography>}
            {error && <Typography color="error">Error loading categories</Typography>}
            <RichTreeViewPro
              // we need to do this to reset the internal state of the tree view
              key={pimSearch ? "search-mode" : "datasource-mode"}
              items={pimSearch ? searchResults : []}
              apiRef={apiRef}
              expandedItems={pimSearch ? expandedItems : undefined}
              onExpandedItemsChange={
                pimSearch ? (event, itemIds) => setExpandedItems(itemIds) : undefined
              }
              onItemClick={(event, itemId) => handleItemClicked(itemId)}
              dataSource={
                pimSearch
                  ? undefined
                  : {
                      getChildrenCount: (item: PimCategoryTreeViewItem) => {
                        return item.childrenCount || item.productCount || 0;
                      },
                      getTreeItems: async (parentCategoryId) => {
                        const item = parentCategoryId
                          ? apiRef.current?.getItem(parentCategoryId)
                          : null;

                        const items = await getItemsForParent({ parentCategoryId });
                        return items;
                      },
                    }
              }
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
