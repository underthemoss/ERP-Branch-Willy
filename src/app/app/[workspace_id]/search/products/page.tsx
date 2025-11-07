"use client";

import { createSearchClient } from "@/lib/searchClient";
import { useConfig } from "@/providers/ConfigProvider";
import { useAuth0 } from "@auth0/auth0-react";
import { history } from "instantsearch.js/es/lib/routers";
import { simple } from "instantsearch.js/es/lib/stateMappings";
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
    <div ref={searchRef} style={{ position: "relative", width: "100%" }}>
      <svg
        style={{
          position: "absolute",
          left: "16px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "20px",
          height: "20px",
          color: "#6b7280",
          zIndex: 1,
        }}
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
        style={{
          width: "100%",
          padding: "14px 48px",
          fontSize: "16px",
          border: "2px solid #e5e7eb",
          borderRadius: "12px",
          outline: "none",
          transition: "all 0.2s ease",
          backgroundColor: "#ffffff",
        }}
        onFocusCapture={(e) => {
          e.target.style.borderColor = "#3b82f6";
          e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
        }}
        onBlurCapture={(e) => {
          e.target.style.borderColor = "#e5e7eb";
          e.target.style.boxShadow = "none";
        }}
      />
      {localQuery && (
        <button
          onClick={() => {
            setLocalQuery("");
            refine("");
            setShowSuggestions(false);
          }}
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
            color: "#6b7280",
            transition: "all 0.2s ease",
            zIndex: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f3f4f6";
            e.currentTarget.style.color = "#111827";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#6b7280";
          }}
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
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            maxHeight: "400px",
            overflowY: "auto",
            zIndex: 1000,
          }}
        >
          <div style={{ padding: "8px 12px", borderBottom: "1px solid #f3f4f6" }}>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px",
                  cursor: "pointer",
                  backgroundColor: isFocused ? "#f9fafb" : "transparent",
                  borderBottom: index < suggestions.length - 1 ? "1px solid #f3f4f6" : "none",
                  transition: "background-color 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "8px",
                    flexShrink: 0,
                    marginRight: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src="https://appcdn.equipmentshare.com/img/cogplaceholder.png"
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#111827",
                      marginBottom: "4px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {name}
                  </div>
                  {(make || model) && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginBottom: "2px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {make && model ? `${make} ${model}` : make || model}
                    </div>
                  )}
                  {categoryBreadcrumb && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#9ca3af",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
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
                  style={{ flexShrink: 0, marginLeft: "8px" }}
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
    <div style={{ marginBottom: "28px" }}>
      <h3
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "#111827",
          marginBottom: "12px",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h3>

      {searchable && (
        <div style={{ position: "relative", marginBottom: "12px" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchForItems(e.target.value);
            }}
            placeholder={`Search ${title.toLowerCase()}...`}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "13px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              outline: "none",
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#3b82f6";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e5e7eb";
            }}
          />
        </div>
      )}

      {items.length === 0 && searchQuery ? (
        <div
          style={{
            padding: "12px 8px",
            fontSize: "13px",
            color: "#6b7280",
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          No results found
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {displayItems.map((item) => (
            <label
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                padding: "6px 8px",
                borderRadius: "6px",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f9fafb";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <input
                type="checkbox"
                checked={item.isRefined}
                onChange={() => refine(item.value)}
                style={{
                  width: "16px",
                  height: "16px",
                  marginRight: "10px",
                  cursor: "pointer",
                  accentColor: "#3b82f6",
                }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: "14px",
                  color: "#374151",
                  fontWeight: item.isRefined ? 500 : 400,
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  fontWeight: 500,
                }}
              >
                {item.count}
              </span>
            </label>
          ))}
        </div>
      )}

      {items.length > 6 && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            marginTop: "8px",
            padding: "6px 0",
            fontSize: "13px",
            color: "#3b82f6",
            fontWeight: 500,
            background: "none",
            border: "none",
            cursor: "pointer",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#2563eb";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#3b82f6";
          }}
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
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
      {items.map((item) =>
        item.refinements.map((refinement) => (
          <div
            key={`${item.attribute}-${refinement.label}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "20px",
              fontSize: "13px",
              color: "#1e40af",
              fontWeight: 500,
            }}
          >
            <span>{getDisplayLabel(refinement.label, item.attribute)}</span>
            <button
              onClick={() => item.refine(refinement)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
                alignItems: "center",
                color: "#1e40af",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#1e3a8a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#1e40af";
              }}
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
          style={{
            padding: "6px 14px",
            fontSize: "13px",
            fontWeight: 500,
            color: "#6b7280",
            backgroundColor: "transparent",
            border: "1px solid #e5e7eb",
            borderRadius: "20px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f9fafb";
            e.currentTarget.style.borderColor = "#d1d5db";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = "#e5e7eb";
          }}
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
}: {
  sortBy: string;
  onSortChange: (value: string) => void;
}) {
  const { nbHits } = useStats();

  const sortOptions = [{ label: "Relevance", value: "" }];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
        paddingBottom: "16px",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      <div style={{ fontSize: "14px", color: "#6b7280", fontWeight: 500 }}>
        <span style={{ color: "#111827", fontWeight: 600 }}>{nbHits.toLocaleString()}</span> results
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <label
          htmlFor="sort-select"
          style={{ fontSize: "14px", color: "#6b7280", fontWeight: 500 }}
        >
          Sort by:
        </label>
        <select
          id="sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          style={{
            padding: "8px 36px 8px 12px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#111827",
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            cursor: "pointer",
            outline: "none",
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            transition: "all 0.2s ease",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#3b82f6";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e5e7eb";
          }}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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
  const imageUrl = "https://appcdn.equipmentshare.com/img/cogplaceholder.png";

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
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      style={{
        display: "block",
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        overflow: "hidden",
        transition: "all 0.3s ease",
        textDecoration: "none",
        color: "inherit",
        height: "100%",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 24px -4px rgba(0, 0, 0, 0.1)";
        e.currentTarget.style.borderColor = "#d1d5db";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "#e5e7eb";
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "75%",
          backgroundColor: "#f9fafb",
          overflow: "hidden",
        }}
      >
        <img
          src={imageUrl}
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
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              padding: "6px 12px",
              fontSize: "11px",
              fontWeight: 700,
              color: "#ffffff",
              backgroundColor: "rgba(17, 24, 39, 0.9)",
              borderRadius: "6px",
              backdropFilter: "blur(8px)",
              letterSpacing: "0.5px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
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
      <div style={{ padding: "16px" }}>
        <h3
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "#111827",
            marginBottom: "8px",
            lineHeight: "1.4",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            minHeight: "42px",
          }}
        >
          {name}
        </h3>

        {makeModelYear && (
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              marginBottom: "8px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {makeModelYear}
          </p>
        )}

        {categoryBreadcrumb && (
          <p
            style={{
              fontSize: "11px",
              color: "#9ca3af",
              marginBottom: "12px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {categoryBreadcrumb}
          </p>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "auto" }}>
          {variant && (
            <span
              style={{
                padding: "4px 8px",
                fontSize: "10px",
                fontWeight: 600,
                color: "#7c3aed",
                backgroundColor: "#f5f3ff",
                borderRadius: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {variant}
            </span>
          )}
          {mpn && (
            <span
              style={{
                padding: "4px 8px",
                fontSize: "10px",
                fontWeight: 500,
                color: "#6b7280",
                backgroundColor: "#f9fafb",
                borderRadius: "4px",
                fontFamily: "monospace",
              }}
            >
              MPN: {mpn}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

// Product Grid
function ProductGrid({ workspaceId }: { workspaceId: string }) {
  const { hits } = useHits<ProductHit>();

  if (hits.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "64px 24px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 24px",
            backgroundColor: "#f3f4f6",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
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
        <h3
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#111827",
            marginBottom: "8px",
          }}
        >
          No results found
        </h3>
        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "20px",
      }}
    >
      {hits.map((hit) => (
        <ProductCard key={hit.objectID} hit={hit} workspaceId={workspaceId} />
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
      style={{
        minWidth: "40px",
        height: "40px",
        padding: "0 12px",
        fontSize: "14px",
        fontWeight: 500,
        color: isActive ? "#ffffff" : "#374151",
        backgroundColor: isActive ? "#3b82f6" : "#ffffff",
        border: "1px solid",
        borderColor: isActive ? "#3b82f6" : "#e5e7eb",
        borderRadius: "8px",
        cursor: isActive ? "default" : "pointer",
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = "#f9fafb";
          e.currentTarget.style.borderColor = "#d1d5db";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = "#ffffff";
          e.currentTarget.style.borderColor = "#e5e7eb";
        }
      }}
    >
      {children}
    </button>
  );

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "8px",
        marginTop: "48px",
        marginBottom: "32px",
      }}
    >
      <PaginationButton page={currentRefinement - 1}>
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </PaginationButton>

      {visiblePages[0] > 0 && (
        <>
          <PaginationButton page={0}>1</PaginationButton>
          {visiblePages[0] > 1 && <span style={{ color: "#9ca3af" }}>...</span>}
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
            <span style={{ color: "#9ca3af" }}>...</span>
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
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "64px 24px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "16px", color: "#ef4444" }}>{error}</p>
      </div>
    );
  }

  if (!searchClient) {
    return (
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "64px 24px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "16px", color: "#6b7280" }}>Loading search...</p>
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
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", marginTop: -16 }}>
      <InstantSearch searchClient={searchClient} indexName="t3_pim_products" routing={routing}>
        <Configure hitsPerPage={24} {...(sortBy ? { sort: sortBy } : {})} />

        {/* Header with Search */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
            position: "sticky",
            right: 0,
            left: 0,
            top: -16,
            zIndex: 100,
          }}
        >
          <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "20px 24px" }}>
            <SearchBar workspaceId={workspaceId} />
          </div>
        </div>

        {/* Main Content */}
        <div style={{ maxWidth: "1600px", margin: "0 auto", display: "flex", minHeight: "100vh" }}>
          {/* Sidebar Filters */}
          <aside
            style={{
              width: "320px",
              flexShrink: 0,
              backgroundColor: "#ffffff",
              borderRight: "1px solid #e5e7eb",
              padding: "24px 20px",
              position: "sticky",
              top: "73px",
              height: "calc(100vh - 80px)",
              overflowY: "auto",
            }}
          >
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#111827",
                marginBottom: "24px",
                letterSpacing: "-0.02em",
              }}
            >
              Filters
            </h2>

            <div style={{ marginBottom: "28px" }}>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: "12px",
                  letterSpacing: "-0.01em",
                }}
              >
                Categories
              </h3>
              <div
                style={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  overflowX: "hidden",
                }}
              >
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
          <main style={{ flex: 1, padding: "32px 32px 64px" }}>
            <div style={{ marginBottom: "24px" }}>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: "8px",
                  letterSpacing: "-0.02em",
                }}
              >
                Product Catalog
              </h1>
              <p style={{ fontSize: "14px", color: "#6b7280" }}>
                Browse and search our complete product inventory
              </p>
            </div>

            <ActiveFilters />
            <ResultsBar sortBy={sortBy} onSortChange={setSortBy} />
            <ProductGrid workspaceId={workspaceId} />
            <CustomPagination />
          </main>
        </div>
      </InstantSearch>
    </div>
  );
}
