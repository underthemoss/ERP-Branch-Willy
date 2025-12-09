"use client";

import { Grid3x3, List } from "lucide-react";
import * as React from "react";

interface ViewToggleProps {
  view: "grid" | "list";
  onChange: (view: "grid" | "list") => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onChange("grid")}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
          ${
            view === "grid"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }
        `}
        aria-label="Grid view"
      >
        <Grid3x3 className="w-4 h-4" />
        <span className="hidden sm:inline">Grid</span>
      </button>
      <button
        onClick={() => onChange("list")}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
          ${
            view === "list"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }
        `}
        aria-label="List view"
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">List</span>
      </button>
    </div>
  );
}
