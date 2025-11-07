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
  InstantSearch,
  useClearRefinements,
  useCurrentRefinements,
  useHits,
  usePagination,
  useRange,
  useRefinementList,
  useSearchBox,
  useStats,
} from "react-instantsearch";

// Asset data structure
interface AssetHit {
  objectID: string;
  details: {
    asset_id: string;
    custom_name: string | null;
    name: string | null;
    description: string | null;
    year: string | null;
    serial_number: string | null;
    vin: string | null;
    model: string | null;
  };
  type: { id: string; name: string };
  make: { id: string | null; name: string | null };
  model: { id: string | null; name: string | null };
  class: { id: string | null; name: string | null };
  company: { id: string; name: string };
  inventory_branch: {
    id: string;
    name: string;
  } | null;
  tracker: { id: string | null };
  photo: { photo_id: string | null; filename: string | null };
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
        placeholder="Search equipment, vehicles, tools..."
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

  // Only hide the section if there are no items AND no search query
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

// Year Range Filter
function YearRangeFilter() {
  const { start, range, canRefine, refine } = useRange({ attribute: "year" });
  const [minValue, setMinValue] = React.useState<string>("");
  const [maxValue, setMaxValue] = React.useState<string>("");

  React.useEffect(() => {
    if (start[0] !== undefined) setMinValue(start[0].toString());
    if (start[1] !== undefined) setMaxValue(start[1].toString());
  }, [start]);

  if (!canRefine) return null;

  const handleApply = () => {
    const min = minValue ? parseFloat(minValue) : undefined;
    const max = maxValue ? parseFloat(maxValue) : undefined;
    refine([min, max]);
  };

  const isActive = start[0] !== undefined || start[1] !== undefined;

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
        Year
      </h3>
      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <input
          type="number"
          placeholder={range.min?.toString() || "Min"}
          value={minValue}
          onChange={(e) => setMinValue(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: "13px",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            outline: "none",
          }}
        />
        <span style={{ display: "flex", alignItems: "center", color: "#9ca3af" }}>—</span>
        <input
          type="number"
          placeholder={range.max?.toString() || "Max"}
          value={maxValue}
          onChange={(e) => setMaxValue(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: "13px",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            outline: "none",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={handleApply}
          style={{
            flex: 1,
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 500,
            color: "#ffffff",
            backgroundColor: "#3b82f6",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#2563eb";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#3b82f6";
          }}
        >
          Apply
        </button>
        {isActive && (
          <button
            onClick={() => {
              setMinValue("");
              setMaxValue("");
              refine([undefined, undefined]);
            }}
            style={{
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 500,
              color: "#6b7280",
              backgroundColor: "transparent",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f9fafb";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

// Active Filters Pills
function ActiveFilters() {
  const { items } = useCurrentRefinements();
  const { refine: clear } = useClearRefinements();

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
            <span>
              {item.label}: {refinement.label}
            </span>
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
function ProductCard({ hit, workspaceId }: { hit: AssetHit; workspaceId: string }) {
  const name = hit.details.custom_name || hit.details.name || "Unnamed Asset";
  const assetId = hit.details.asset_id;
  const type = hit.type.name;
  const make = hit.make?.name || "-";
  const model = hit.model?.name || "-";
  const year = hit.details.year || "-";
  const imageUrl = hit.photo?.filename
    ? `https://appcdn.equipmentshare.com/uploads/small/${hit.photo.filename}`
    : "https://appcdn.equipmentshare.com/img/cogplaceholder.png";

  return (
    <a
      href={`/app/${workspaceId}/assets/${assetId}`}
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
          onError={(e: any) => {
            e.target.src = "https://appcdn.equipmentshare.com/img/cogplaceholder.png";
          }}
        />
        {hit.tracker?.id && (
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: 600,
              color: "#ffffff",
              backgroundColor: "rgba(16, 185, 129, 0.9)",
              borderRadius: "6px",
              backdropFilter: "blur(8px)",
            }}
          >
            GPS Tracked
          </div>
        )}
      </div>
      <div style={{ padding: "16px" }}>
        <h3
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "#111827",
            marginBottom: "6px",
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
        <p
          style={{
            fontSize: "13px",
            color: "#6b7280",
            marginBottom: "12px",
          }}
        >
          {make} {model}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
          <span
            style={{
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: 600,
              color: "#1e40af",
              backgroundColor: "#eff6ff",
              borderRadius: "6px",
            }}
          >
            {type}
          </span>
          {year !== "-" && (
            <span
              style={{
                padding: "4px 10px",
                fontSize: "11px",
                fontWeight: 600,
                color: "#6b7280",
                backgroundColor: "#f3f4f6",
                borderRadius: "6px",
              }}
            >
              {year}
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: "11px",
            color: "#9ca3af",
            fontWeight: 500,
          }}
        >
          ID: {assetId}
        </p>
      </div>
    </a>
  );
}

// Product Grid
function ProductGrid({ workspaceId }: { workspaceId: string }) {
  const { hits } = useHits<AssetHit>();

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
export default function AssetSearchPage() {
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
      <InstantSearch searchClient={searchClient} indexName="t3_assets" routing={routing}>
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
            // marginTop: -16,
            // top: -16,
            // paddingTop: 0,
            // marginTop: 16,
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
              width: "280px",
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

            <FilterSection title="Asset Type" attribute="type" />
            <FilterSection title="Make" attribute="make" searchable />
            <FilterSection title="Model" attribute="model" searchable />
            <FilterSection title="Class" attribute="class" />
            <YearRangeFilter />
            <FilterSection title="Location" attribute="inventory_branch" />
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
                Equipment & Assets
              </h1>
              <p style={{ fontSize: "14px", color: "#6b7280" }}>
                Find the perfect equipment for your project
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
