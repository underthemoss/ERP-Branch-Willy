"use client";

import { X } from "lucide-react";
import React, { useState } from "react";
import { HierarchicalMenu, useRefinementList } from "react-instantsearch";

// Filter Section Component
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
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (items.length === 0 && !searchQuery) return null;

  const displayItems = showAll ? items : items.slice(0, 6);

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>

      {searchable && (
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchForItems(e.target.value);
          }}
          placeholder={`Search ${title.toLowerCase()}...`}
          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg mb-2 focus:border-blue-500 outline-none"
        />
      )}

      {items.length === 0 && searchQuery ? (
        <p className="text-xs text-gray-500 text-center py-2">No results found</p>
      ) : (
        <div className="space-y-1.5">
          {displayItems.map((item) => (
            <label
              key={item.label}
              className="flex items-center cursor-pointer px-2 py-1.5 rounded hover:bg-gray-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={item.isRefined}
                onChange={() => refine(item.value)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
              />
              <span
                className={`ml-2 text-sm flex-1 ${item.isRefined ? "font-medium text-gray-900" : "text-gray-700"}`}
              >
                {item.label}
              </span>
              <span className="text-xs text-gray-500">{item.count}</span>
            </label>
          ))}
        </div>
      )}

      {items.length > 6 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
        >
          {showAll ? "Show less" : `Show ${items.length - 6} more`}
        </button>
      )}
    </div>
  );
}

export default function CatalogSidebar() {
  return (
    <aside className="w-80 bg-white border-r border-gray-200 p-6 sticky top-[88px] h-[calc(100vh-88px)] overflow-y-auto shrink-0 hidden lg:block">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Filters</h2>

      {/* Categories */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Categories</h3>
        <div className="max-h-72 overflow-y-auto">
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
      <FilterSection title="Location" attribute="location" />
    </aside>
  );
}
