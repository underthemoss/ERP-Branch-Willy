"use client";

import { createSearchClient } from "@/lib/searchClient";
import { useConfig } from "@/providers/ConfigProvider";
import { useAuth0 } from "@auth0/auth0-react";
import { useParams } from "next/navigation";
import * as React from "react";
import { Configure, HierarchicalMenu, InstantSearch, useHits, useStats } from "react-instantsearch";
import "instantsearch.css/themes/satellite.css";

// Category data structure
interface CategoryHit {
  objectID: string;
  data: {
    name: string;
    path: string;
    description?: string;
    has_products?: boolean;
    platform_id?: string;
    is_deleted?: boolean;
  };
  [key: string]: any;
}

// Results Stats Component
function ResultsStats() {
  const { nbHits } = useStats();

  return (
    <div style={{ marginBottom: "24px", fontSize: "14px", color: "#6b7280" }}>
      <span style={{ fontWeight: 600, color: "#111827" }}>{nbHits.toLocaleString()}</span>{" "}
      {nbHits === 1 ? "category" : "categories"} found
    </div>
  );
}

// Category Hits Component
function CategoryHits() {
  const { hits } = useHits<CategoryHit>();

  if (hits.length === 0) {
    return (
      <div
        style={{
          padding: "48px 24px",
          textAlign: "center",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            backgroundColor: "#f3f4f6",
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
        <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>
          No categories found
        </h3>
        <p style={{ fontSize: "14px", color: "#6b7280" }}>
          Try adjusting your filters or search criteria
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      {hits.map((hit) => (
        <div
          key={hit.objectID}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            padding: "16px",
            transition: "all 0.2s ease-in-out",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#d1d5db";
            e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#e5e7eb";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: 0 }}>
              {hit.data.name}
            </h3>
            <span
              style={{
                fontSize: "11px",
                fontFamily: "monospace",
                color: "#6b7280",
                backgroundColor: "#f3f4f6",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              {hit.objectID}
            </span>
          </div>
          {hit.data.path && (
            <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}>
              {hit.data.path}
            </div>
          )}
          {hit.data.description && (
            <div style={{ fontSize: "12px", color: "#9ca3af", fontStyle: "italic" }}>
              {hit.data.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Main Page Component
export default function CategoryBrowserPage() {
  const params = useParams();
  const workspaceId = params.workspace_id as string;

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
        <p style={{ fontSize: "16px", color: "#6b7280" }}>Loading category browser...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", padding: "32px" }}>
      <InstantSearch searchClient={searchClient} indexName="t3_pim_categories" routing={true}>
        <Configure hitsPerPage={24} />

        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ marginBottom: "32px" }}>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: 700,
                color: "#111827",
                marginBottom: "8px",
                letterSpacing: "-0.02em",
              }}
            >
              Category Browser
            </h1>
            <p style={{ fontSize: "14px", color: "#6b7280" }}>
              Navigate through product categories
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              overflow: "hidden",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              marginBottom: "32px",
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
              limit={1000}
              separator="|"
              sortBy={["name"]}
            />
          </div>

          <ResultsStats />
          <CategoryHits />
        </div>
      </InstantSearch>
    </div>
  );
}
