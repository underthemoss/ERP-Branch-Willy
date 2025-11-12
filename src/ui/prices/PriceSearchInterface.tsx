"use client";

import { createSearchClient } from "@/lib/searchClient";
import { useConfig } from "@/providers/ConfigProvider";
import { GeneratedImage } from "@/ui/GeneratedImage";
import { useAuth0 } from "@auth0/auth0-react";
import { history } from "instantsearch.js/es/lib/routers";
import { simple } from "instantsearch.js/es/lib/stateMappings";
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

// Price data structure
interface PriceHit {
  objectID: string;
  _id: string;
  workspaceId: string;
  name: string | null;
  priceType: "RENTAL" | "SALE";
  pimCategoryId: string;
  pimCategoryPath: string;
  pimCategoryName: string;
  pimProductId: string | null;
  priceBookId: string | null;
  businessContactId: string | null;
  projectId: string | null;
  location: string | null;
  pricePerDayInCents: number | null;
  pricePerWeekInCents: number | null;
  pricePerMonthInCents: number | null;
  unitCostInCents: number | null;
  price_book: {
    name: string;
  } | null;
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

// Modern Search Bar Component
function SearchBar() {
  const { query, refine } = useSearchBox();
  const [localQuery, setLocalQuery] = React.useState(query);

  React.useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg
        style={{
          position: "absolute",
          left: "16px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "20px",
          height: "20px",
          color: "#6b7280",
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
          refine(e.target.value);
        }}
        placeholder="Search prices, categories, price books..."
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
        onFocus={(e) => {
          e.target.style.borderColor = "#3b82f6";
          e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#e5e7eb";
          e.target.style.boxShadow = "none";
        }}
      />
      {localQuery && (
        <button
          onClick={() => {
            setLocalQuery("");
            refine("");
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

  if (items.length === 0 && !searchQuery) return null;

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

  const getDisplayLabel = (label: string, attribute: string): string => {
    if (attribute.startsWith("category_lvl")) {
      const parts = label.split("|");
      const maxLength = 30;
      const truncatedParts = parts.map((part) => {
        if (part.length > maxLength) {
          return part.substring(0, maxLength - 3) + "...";
        }
        return part;
      });
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

// Results Bar with Stats
function ResultsBar() {
  const { nbHits } = useStats();

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
        <label style={{ fontSize: "14px", color: "#6b7280", fontWeight: 500 }}>
          Sort by: Relevance
        </label>
      </div>
    </div>
  );
}

// Format price in cents to dollars
function formatPrice(cents: number | null): string {
  if (cents === null || cents === undefined) return "-";
  return `$${(cents / 100).toFixed(2)}`;
}

// Modern Price Card
function PriceCard({ hit }: { hit: PriceHit }) {
  const priceName = hit.name || "Unnamed Price";
  const priceType = hit.priceType;
  const priceBookName = hit.price_book?.name || "No price book";
  const location = hit.location;

  // Build category breadcrumb from pimCategoryPath
  const getCategoryBreadcrumb = (): string => {
    if (!hit.pimCategoryPath) return "";
    // Remove leading/trailing pipes and split on |
    const cleaned = hit.pimCategoryPath.replace(/^\||\|$/g, "");
    const parts = cleaned.split("|").filter((part) => part.trim());
    return parts.join(" › ");
  };

  const categoryBreadcrumb = getCategoryBreadcrumb();

  // Type badge colors
  const typeBadgeStyles =
    priceType === "RENTAL"
      ? { bg: "#eff6ff", color: "#1e40af" }
      : { bg: "#f0fdf4", color: "#15803d" };

  return (
    <div
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
        cursor: "default",
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
        <GeneratedImage
          entity="price"
          entityId={hit.objectID}
          alt={priceName}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            padding: "6px 12px",
            fontSize: "11px",
            fontWeight: 700,
            color: typeBadgeStyles.color,
            backgroundColor: typeBadgeStyles.bg,
            borderRadius: "6px",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          {priceType}
        </div>
      </div>
      <div style={{ padding: "16px" }}>
        {categoryBreadcrumb && (
          <p
            style={{
              fontSize: "11px",
              color: "#9ca3af",
              marginBottom: "6px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {categoryBreadcrumb}
          </p>
        )}

        <h3
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#111827",
            marginBottom: "12px",
            lineHeight: "1.4",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            minHeight: "44px",
          }}
        >
          {priceName}
        </h3>

        <div
          style={{
            borderTop: "1px solid #f3f4f6",
            paddingTop: "12px",
            marginBottom: "12px",
          }}
        >
          {priceType === "RENTAL" ? (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span style={{ fontSize: "13px", color: "#6b7280" }}>1 Day:</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                  {formatPrice(hit.pricePerDayInCents)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span style={{ fontSize: "13px", color: "#6b7280" }}>7 Days:</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                  {formatPrice(hit.pricePerWeekInCents)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: "13px", color: "#6b7280" }}>28 Days:</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                  {formatPrice(hit.pricePerMonthInCents)}
                </span>
              </div>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "13px", color: "#6b7280" }}>Unit Cost:</span>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                {formatPrice(hit.unitCostInCents)} per unit
              </span>
            </div>
          )}
        </div>

        <div
          style={{
            borderTop: "1px solid #f3f4f6",
            paddingTop: "12px",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              color: "#6b7280",
              marginBottom: "4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {priceBookName}
          </p>
          {location && (
            <p
              style={{
                fontSize: "12px",
                color: "#6b7280",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <span>📍</span>
              {location}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Price Grid
function PriceGrid() {
  const { hits } = useHits<PriceHit>();

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
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "20px",
      }}
    >
      {hits.map((hit) => (
        <PriceCard key={hit.objectID} hit={hit} />
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

// Props for the search interface
export interface PriceSearchInterfaceProps {
  workspaceId: string;
}

// Main Search Interface Component
export function PriceSearchInterface({ workspaceId }: PriceSearchInterfaceProps) {
  const config = useConfig();
  const { getAccessTokenSilently } = useAuth0();
  const [searchClient, setSearchClient] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

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
      <InstantSearch searchClient={searchClient} indexName="es_erp_prices" routing={routing}>
        <Configure hitsPerPage={24} />

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
            <SearchBar />
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
            <FilterSection title="Price Type" attribute="priceType" />
            <FilterSection title="Price Book" attribute="price_book_name" searchable />
            <FilterSection title="Location" attribute="location" />
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
                Price Search
              </h1>
              <p style={{ fontSize: "14px", color: "#6b7280" }}>
                Search and browse pricing across categories and price books
              </p>
            </div>

            <ActiveFilters />
            <ResultsBar />
            <PriceGrid />
            <CustomPagination />
          </main>
        </div>
      </InstantSearch>
    </div>
  );
}
