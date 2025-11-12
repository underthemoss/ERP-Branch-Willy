"use client";

import { createSearchClient } from "@/lib/searchClient";
import { useConfig } from "@/providers/ConfigProvider";
import { GeneratedImage } from "@/ui/GeneratedImage";
import { useAuth0 } from "@auth0/auth0-react";
import { history } from "instantsearch.js/es/lib/routers";
import { simple } from "instantsearch.js/es/lib/stateMappings";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import {
  Configure,
  HierarchicalMenu,
  InstantSearch,
  useClearRefinements,
  useCurrentRefinements,
  useHits,
  usePagination,
  useRefinementList,
  useSearchBox,
  useStats,
} from "react-instantsearch";
import "instantsearch.css/themes/satellite.css";

// Product data structure
interface ProductHit {
  objectID: string;
  data: {
    platform_id: string;
    is_deleted: boolean;
    product_core_attributes: {
      name: string;
      make: string | null;
      model: string | null;
      year: string | null;
      variant: string | null;
      make_platform_id: string | null;
    };
    product_category: {
      name: string;
      path: string;
      category_platform_id: string;
      id: string;
    };
    product_source_attributes: {
      sku: string | null;
      upc: string | null;
      manufacturer_part_number: string | null;
      source: string | null;
    };
  };
  category_lvl1?: string;
  category_lvl2?: string;
  category_lvl3?: string;
  category_lvl4?: string;
  category_lvl5?: string;
  category_lvl6?: string;
  category_lvl7?: string;
  category_lvl8?: string;
  category_lvl9?: string;
  category_lvl10?: string;
  category_lvl11?: string;
  category_lvl12?: string;
}

// Modern Search Bar Component with Autocomplete
function SearchBar({ workspaceId }: { workspaceId: string }) {
  const { query, refine } = useSearchBox();
  const config = useConfig();
  const { getAccessTokenSilently } = useAuth0();
  const [localQuery, setLocalQuery] = React.useState(query);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const [suggestions, setSuggestions] = React.useState<ProductHit[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = React.useState(false);
  const [autocompleteClient, setAutocompleteClient] = React.useState<any>(null);
  const searchRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  // Initialize autocomplete search client
  React.useEffect(() => {
    async function initAutocomplete() {
      try {
        const token = await getAccessTokenSilently({ cacheMode: "on" });
        const client = createSearchClient(token, config.searchApiUrl, workspaceId);
        setAutocompleteClient(client);
      } catch (error) {
        console.error("Error initializing autocomplete client:", error);
      }
    }
    initAutocomplete();
  }, [getAccessTokenSilently, config.searchApiUrl, workspaceId]);

  // Show suggestions when typing, hide when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch autocomplete suggestions from backend
  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (!localQuery || localQuery.length < 2 || !autocompleteClient) {
        setSuggestions([]);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const results = await autocompleteClient.search([
          {
            indexName: "t3_pim_products",
            params: {
              query: localQuery,
              hitsPerPage: 8,
            },
          },
        ]);

        if (results.results?.[0]?.hits) {
          setSuggestions(results.results[0].hits);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 150);
    return () => clearTimeout(debounceTimer);
  }, [localQuery, autocompleteClient]);

  const getCategoryBreadcrumb = (product: ProductHit): string => {
    const levels: string[] = [];
    for (let i = 1; i <= 12; i++) {
      const levelKey = `category_lvl${i}` as keyof ProductHit;
      const levelValue = product[levelKey];
      if (levelValue && typeof levelValue === "string") {
        // Extract the last part after the pipe separator
        const parts = levelValue.split("|");
        const categoryName = parts[parts.length - 1];
        if (categoryName && !levels.includes(categoryName)) {
          levels.push(categoryName);
        }
      } else {
        break;
      }
    }
    return levels.join(" › ");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (showSuggestions && focusedIndex >= 0 && suggestions[focusedIndex]) {
        // Select focused suggestion
        e.preventDefault();
        const product = suggestions[focusedIndex];
        const productName = product.data.product_core_attributes.name || "";
        setLocalQuery(productName);
        refine(productName);
        setShowSuggestions(false);
        setFocusedIndex(-1);
      } else {
        // Submit search
        e.preventDefault();
        refine(localQuery);
        setShowSuggestions(false);
        setFocusedIndex(-1);
      }
      return;
    }

    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Escape":
        setShowSuggestions(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (product: ProductHit) => {
    const productName = product.data.product_core_attributes.name || "";
    setLocalQuery(productName);
    refine(productName);
    setShowSuggestions(false);
    setFocusedIndex(-1);
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <svg
        className="absolute left-4 top-1/2 z-[1] h-5 w-5 -translate-y-1/2 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={localQuery}
        onChange={(e) => {
          setLocalQuery(e.target.value);
          setShowSuggestions(true);
          setFocusedIndex(-1);
        }}
        onFocus={() => {
          if (localQuery.length >= 2) {
            setShowSuggestions(true);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search products by name, make, model, SKU, UPC..."
        className="w-full rounded-xl border-2 border-gray-200 bg-white px-12 py-3.5 text-base outline-none transition-all duration-200 ease-in-out focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
      />
      {localQuery && (
        <button
          onClick={() => {
            setLocalQuery("");
            refine("");
            setShowSuggestions(false);
          }}
          className="absolute right-3 top-1/2 z-[1] flex -translate-y-1/2 items-center justify-center rounded border-none bg-transparent p-1 text-gray-500 transition-all duration-200 ease-in-out hover:bg-gray-100 hover:text-gray-900"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      {/* Autocomplete Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[1000] max-h-[400px] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)]">
          <div className="border-b border-gray-100 px-3 py-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Product Suggestions
            </div>
          </div>
          {suggestions.map((product, index) => {
            const name = product.data.product_core_attributes.name || "Unnamed Product";
            const make = product.data.product_core_attributes.make || "";
            const model = product.data.product_core_attributes.model || "";
            const categoryBreadcrumb = getCategoryBreadcrumb(product);
            const isFocused = index === focusedIndex;

            return (
              <div
                key={product.objectID}
                onClick={() => handleSuggestionClick(product)}
                onMouseEnter={() => setFocusedIndex(index)}
                className={`flex cursor-pointer items-center p-3 transition-[background-color] duration-150 ease-in-out ${
                  isFocused ? "bg-gray-50" : "bg-transparent"
                } ${index < suggestions.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <div className="mr-3 flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                  <GeneratedImage
                    entity="pim-product"
                    entityId={product.objectID}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-gray-900">
                    {name}
                  </div>
                  {(make || model) && (
                    <div className="mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-gray-500">
                      {make && model ? `${make} ${model}` : make || model}
                    </div>
                  )}
                  {categoryBreadcrumb && (
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-gray-400">
                      {categoryBreadcrumb}
                    </div>
                  )}
                </div>
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="#9ca3af"
                  viewBox="0 0 24 24"
                  className="ml-2 flex-shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Modern Filter Section
interface FilterProps {
  title: string;
  attribute: string;
  searchable?: boolean;
}

function FilterSection({ title, attribute, searchable = false }: FilterProps) {
  const { items, refine, searchForItems } = useRefinementList({
    attribute,
    limit: 100,
  });
  const [showAll, setShowAll] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const displayItems = showAll ? items : items.slice(0, 6);

  return (
    <div className="mb-7">
      <h3 className="mb-3 text-sm font-semibold tracking-tight text-gray-900">{title}</h3>

      {searchable && (
        <div className="relative mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchForItems(e.target.value);
            }}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] outline-none transition-all duration-200 ease-in-out focus:border-blue-500"
          />
        </div>
      )}

      {items.length === 0 && searchQuery ? (
        <div className="px-2 py-3 text-center text-[13px] italic text-gray-500">
          No results found
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {displayItems.map((item) => (
            <label
              key={item.label}
              className="flex cursor-pointer items-center rounded-md px-2 py-1.5 transition-all duration-150 ease-in-out hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={item.isRefined}
                onChange={() => refine(item.value)}
                className="mr-2.5 h-4 w-4 cursor-pointer accent-blue-500"
              />
              <span
                className={`flex-1 text-sm text-gray-700 ${item.isRefined ? "font-medium" : "font-normal"}`}
              >
                {item.label}
              </span>
              <span className="text-xs font-medium text-gray-400">{item.count}</span>
            </label>
          ))}
        </div>
      )}

      {items.length > 6 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-2 border-none bg-transparent px-0 py-1.5 text-[13px] font-medium text-blue-500 transition-colors duration-200 ease-in-out hover:text-blue-600"
        >
          {showAll ? "Show less" : `Show ${items.length - 6} more`}
        </button>
      )}
    </div>
  );
}

// Active Filters Pills
function ActiveFilters() {
  const { items } = useCurrentRefinements();
  const { refine: clear } = useClearRefinements();

  // Parse hierarchical labels to show only the selected category
  const getDisplayLabel = (label: string, attribute: string): string => {
    // For hierarchical categories, show the full breadcrumb path
    if (attribute.startsWith("category_lvl")) {
      const parts = label.split("|");
      const maxLength = 30; // Max characters per breadcrumb part

      // Truncate each part if needed
      const truncatedParts = parts.map((part) => {
        if (part.length > maxLength) {
          return part.substring(0, maxLength - 3) + "...";
        }
        return part;
      });

      // Return the full breadcrumb with nice formatting
      return truncatedParts.join(" › ");
    }
    return label;
  };

  if (items.length === 0) return null;

  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {items.map((item) =>
        item.refinements.map((refinement) => (
          <div
            key={`${item.attribute}-${refinement.label}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[13px] font-medium text-blue-900"
          >
            <span>{getDisplayLabel(refinement.label, item.attribute)}</span>
            <button
              onClick={() => item.refine(refinement)}
              className="flex items-center border-none bg-transparent p-0.5 text-blue-900 transition-colors duration-200 ease-in-out hover:text-blue-950"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )),
      )}
      {items.length > 0 && (
        <button
          onClick={() => clear()}
          className="cursor-pointer rounded-full border border-gray-200 bg-transparent px-3.5 py-1.5 text-[13px] font-medium text-gray-500 transition-all duration-200 ease-in-out hover:border-gray-300 hover:bg-gray-50"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

// Results Bar with Stats and Sort
function ResultsBar({
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: {
  sortBy: string;
  onSortChange: (value: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}) {
  const { nbHits } = useStats();

  const sortOptions = [{ label: "Relevance", value: "" }];

  return (
    <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
      <div className="text-sm font-medium text-gray-500">
        <span className="font-semibold text-gray-900">{nbHits.toLocaleString()}</span> results
      </div>
      <div className="flex items-center gap-3">
        <label htmlFor="sort-select" className="text-sm font-medium text-gray-500">
          Sort by:
        </label>
        <select
          id="sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 12 12%27%3E%3Cpath fill=%27%236b7280%27 d=%27M6 9L1 4h10z%27/%3E%3C/svg%3E')] bg-[length:12px_12px] bg-[center_right_12px] bg-no-repeat py-2 pl-3 pr-9 text-sm font-medium text-gray-900 outline-none transition-all duration-200 ease-in-out focus:border-blue-500"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`flex items-center justify-center rounded-md p-2 transition-all duration-200 ${
              viewMode === "grid"
                ? "bg-blue-500 text-white"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
            title="Grid View"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`flex items-center justify-center rounded-md p-2 transition-all duration-200 ${
              viewMode === "list"
                ? "bg-blue-500 text-white"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
            title="List View"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Modern Product Card
function ProductCard({ hit, workspaceId }: { hit: ProductHit; workspaceId: string }) {
  const name = hit.data.product_core_attributes.name || "Unnamed Product";
  const make = hit.data.product_core_attributes.make || null;
  const model = hit.data.product_core_attributes.model || null;
  const year = hit.data.product_core_attributes.year || null;
  const variant = hit.data.product_core_attributes.variant || null;
  const sku = hit.data.product_source_attributes.sku || null;
  const mpn = hit.data.product_source_attributes.manufacturer_part_number || null;

  // Build category breadcrumb
  const getCategoryBreadcrumb = (): string => {
    const levels: string[] = [];
    for (let i = 1; i <= 12; i++) {
      const levelKey = `category_lvl${i}` as keyof ProductHit;
      const levelValue = hit[levelKey];
      if (levelValue && typeof levelValue === "string") {
        const parts = levelValue.split("|");
        const categoryName = parts[parts.length - 1];
        if (categoryName && !levels.includes(categoryName)) {
          levels.push(categoryName);
        }
      } else {
        break;
      }
    }
    return levels.join(" › ");
  };

  const categoryBreadcrumb = getCategoryBreadcrumb();

  // Build make/model/year line
  const makeModelYear = [make, model, year].filter(Boolean).join(" • ");

  return (
    <Link
      href={`/app/${workspaceId}/products/${hit.objectID}`}
      className="block h-full overflow-hidden rounded-xl border border-gray-200 bg-white text-inherit no-underline transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_12px_24px_-4px_rgba(0,0,0,0.1)]"
    >
      <div className="relative w-full overflow-hidden bg-gray-50 pt-[75%]">
        <GeneratedImage
          entity="pim-product"
          entityId={hit.objectID}
          size="card"
          alt={name}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        {sku && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-gray-900/90 px-3 py-1.5 text-[11px] font-bold tracking-wide text-white backdrop-blur-sm">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M3 3h7l2 2h9a2 2 0 012 2v12a2 2 0 01-2 2H3a2 2 0 01-2-2V5a2 2 0 012-2z" />
            </svg>
            {sku}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="mb-2 min-h-[42px] overflow-hidden text-ellipsis text-[15px] font-semibold leading-[1.4] text-gray-900 [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box]">
          {name}
        </h3>

        {makeModelYear && (
          <p className="mb-2 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-gray-500">
            {makeModelYear}
          </p>
        )}

        {categoryBreadcrumb && (
          <p className="mb-3 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-gray-400">
            {categoryBreadcrumb}
          </p>
        )}

        <div className="mt-auto flex flex-wrap gap-1.5">
          {variant && (
            <span className="rounded bg-purple-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-purple-600">
              {variant}
            </span>
          )}
          {mpn && (
            <span className="rounded bg-gray-50 px-2 py-1 font-mono text-[10px] font-medium text-gray-500">
              MPN: {mpn}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// Product Grid
function ProductGrid({ workspaceId }: { workspaceId: string }) {
  const { hits } = useHits<ProductHit>();

  if (hits.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <svg
            width="32"
            height="32"
            fill="none"
            stroke="#9ca3af"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">No results found</h3>
        <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
      {hits.map((hit) => (
        <ProductCard key={hit.objectID} hit={hit} workspaceId={workspaceId} />
      ))}
    </div>
  );
}

// Product List Item (for list view)
function ProductListItem({ hit, workspaceId }: { hit: ProductHit; workspaceId: string }) {
  const name = hit.data.product_core_attributes.name || "Unnamed Product";
  const make = hit.data.product_core_attributes.make || null;
  const model = hit.data.product_core_attributes.model || null;
  const year = hit.data.product_core_attributes.year || null;
  const variant = hit.data.product_core_attributes.variant || null;
  const sku = hit.data.product_source_attributes.sku || null;
  const mpn = hit.data.product_source_attributes.manufacturer_part_number || null;

  // Build category breadcrumb
  const getCategoryBreadcrumb = (): string => {
    const levels: string[] = [];
    for (let i = 1; i <= 12; i++) {
      const levelKey = `category_lvl${i}` as keyof ProductHit;
      const levelValue = hit[levelKey];
      if (levelValue && typeof levelValue === "string") {
        const parts = levelValue.split("|");
        const categoryName = parts[parts.length - 1];
        if (categoryName && !levels.includes(categoryName)) {
          levels.push(categoryName);
        }
      } else {
        break;
      }
    }
    return levels.join(" › ");
  };

  const categoryBreadcrumb = getCategoryBreadcrumb();
  const makeModelYear = [make, model, year].filter(Boolean).join(" • ");

  return (
    <Link
      href={`/app/${workspaceId}/products/${hit.objectID}`}
      className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 text-inherit no-underline transition-all duration-200 ease-in-out hover:border-gray-300 hover:shadow-md"
    >
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50">
        <GeneratedImage
          entity="pim-product"
          entityId={hit.objectID}
          size="list"
          alt={name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="mb-1 text-base font-semibold text-gray-900">{name}</h3>
        {makeModelYear && <p className="mb-1 text-sm text-gray-500">{makeModelYear}</p>}
        {categoryBreadcrumb && <p className="mb-2 text-xs text-gray-400">{categoryBreadcrumb}</p>}
        <div className="flex flex-wrap gap-2">
          {sku && (
            <span className="inline-flex items-center gap-1 rounded bg-gray-900/90 px-2 py-1 font-mono text-[10px] font-bold tracking-wide text-white">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M3 3h7l2 2h9a2 2 0 012 2v12a2 2 0 01-2 2H3a2 2 0 01-2-2V5a2 2 0 012-2z" />
              </svg>
              {sku}
            </span>
          )}
          {variant && (
            <span className="rounded bg-purple-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-purple-600">
              {variant}
            </span>
          )}
          {mpn && (
            <span className="rounded bg-gray-50 px-2 py-1 font-mono text-[10px] font-medium text-gray-500">
              MPN: {mpn}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// Product List
function ProductList({ workspaceId }: { workspaceId: string }) {
  const { hits } = useHits<ProductHit>();

  if (hits.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <svg
            width="32"
            height="32"
            fill="none"
            stroke="#9ca3af"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">No results found</h3>
        <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {hits.map((hit) => (
        <ProductListItem key={hit.objectID} hit={hit} workspaceId={workspaceId} />
      ))}
    </div>
  );
}

// Modern Pagination
function CustomPagination() {
  const { currentRefinement, nbPages, refine } = usePagination();

  if (nbPages <= 1) return null;

  const pages = Array.from({ length: nbPages }, (_, i) => i);
  const maxVisible = 7;
  let visiblePages: number[];

  if (nbPages <= maxVisible) {
    visiblePages = pages;
  } else {
    const start = Math.max(0, currentRefinement - 3);
    const end = Math.min(nbPages, start + maxVisible);
    visiblePages = pages.slice(start, end);
  }

  const PaginationButton = ({
    page,
    isActive,
    children,
  }: {
    page?: number;
    isActive?: boolean;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => page !== undefined && refine(page)}
      disabled={isActive}
      className={`flex min-w-[40px] items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out ${
        isActive
          ? "cursor-default border-blue-500 bg-blue-500 text-white"
          : "cursor-pointer border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="mb-8 mt-12 flex items-center justify-center gap-2">
      <PaginationButton page={currentRefinement - 1}>
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </PaginationButton>

      {visiblePages[0] > 0 && (
        <>
          <PaginationButton page={0}>1</PaginationButton>
          {visiblePages[0] > 1 && <span className="text-gray-400">...</span>}
        </>
      )}

      {visiblePages.map((page) => (
        <PaginationButton key={page} page={page} isActive={page === currentRefinement}>
          {page + 1}
        </PaginationButton>
      ))}

      {visiblePages[visiblePages.length - 1] < nbPages - 1 && (
        <>
          {visiblePages[visiblePages.length - 1] < nbPages - 2 && (
            <span className="text-gray-400">...</span>
          )}
          <PaginationButton page={nbPages - 1}>{nbPages}</PaginationButton>
        </>
      )}

      <PaginationButton page={currentRefinement + 1}>
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </PaginationButton>
    </div>
  );
}

// Main Page Component
export default function ProductSearchPage() {
  const params = useParams();
  const workspaceId = params.workspace_id as string;
  const config = useConfig();
  const { getAccessTokenSilently } = useAuth0();
  const [searchClient, setSearchClient] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [sortBy, setSortBy] = React.useState<string>("");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  React.useEffect(() => {
    async function initializeSearch() {
      try {
        const token = await getAccessTokenSilently({ cacheMode: "on" });
        const client = createSearchClient(token, config.searchApiUrl, workspaceId);
        setSearchClient(client);
      } catch (err) {
        console.error("Error initializing search client:", err);
        setError("Failed to initialize search. Please try refreshing the page.");
      }
    }

    initializeSearch();
  }, [getAccessTokenSilently, config.searchApiUrl, workspaceId]);

  if (error) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-16 text-center">
        <p className="text-base text-red-500">{error}</p>
      </div>
    );
  }

  if (!searchClient) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-16 text-center">
        <p className="text-base text-gray-500">Loading search...</p>
      </div>
    );
  }

  const routing = {
    router: history({
      cleanUrlOnDispose: false,
    }),
    stateMapping: simple(),
  };

  return (
    <div className="-mt-4 min-h-screen bg-gray-50">
      <InstantSearch searchClient={searchClient} indexName="t3_pim_products" routing={routing}>
        <Configure hitsPerPage={24} {...(sortBy ? { sort: sortBy } : {})} />

        {/* Header with Search */}
        <div className="sticky -top-4 left-0 right-0 z-[100] border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-[1600px] px-6 py-5">
            <SearchBar workspaceId={workspaceId} />
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto flex min-h-screen max-w-[1600px]">
          {/* Sidebar Filters */}
          <aside className="sticky top-[73px] h-[calc(100vh-80px)] w-80 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white px-5 py-6">
            <h2 className="mb-6 text-base font-bold tracking-tight text-gray-900">Filters</h2>

            <div className="mb-7">
              <h3 className="mb-3 text-sm font-semibold tracking-tight text-gray-900">
                Categories
              </h3>
              <div className="max-h-[300px] overflow-x-hidden overflow-y-auto">
                <HierarchicalMenu
                  attributes={[
                    "category_lvl1",
                    "category_lvl2",
                    "category_lvl3",
                    "category_lvl4",
                    "category_lvl5",
                    "category_lvl6",
                    "category_lvl7",
                    "category_lvl8",
                    "category_lvl9",
                    "category_lvl10",
                    "category_lvl11",
                    "category_lvl12",
                  ]}
                  limit={100}
                  separator="|"
                  sortBy={["name"]}
                />
              </div>
            </div>
            <FilterSection title="Make" attribute="make" searchable />
            <FilterSection title="Model" attribute="model" searchable />
            <FilterSection title="Variant" attribute="variant" />
            <FilterSection title="Year" attribute="year" />
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 px-8 pb-16 pt-8">
            <div className="mb-6">
              <h1 className="mb-2 text-[32px] font-bold tracking-tight text-gray-900">
                Product Catalog
              </h1>
              <p className="text-sm text-gray-500">
                Browse and search our complete product inventory
              </p>
            </div>

            <ActiveFilters />
            <ResultsBar
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
            {viewMode === "grid" ? (
              <ProductGrid workspaceId={workspaceId} />
            ) : (
              <ProductList workspaceId={workspaceId} />
            )}
            <CustomPagination />
          </main>
        </div>
      </InstantSearch>
    </div>
  );
}
