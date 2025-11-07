"use client";

import { createSearchClient } from "@/lib/searchClient";
import { useConfig } from "@/providers/ConfigProvider";
import { useAuth0 } from "@auth0/auth0-react";
import { useParams } from "next/navigation";
import * as React from "react";
import { Configure, HierarchicalMenu, InstantSearch } from "react-instantsearch";
import "instantsearch.css/themes/satellite.css";

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
        <Configure hitsPerPage={0} />

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
        </div>
      </InstantSearch>
    </div>
  );
}
