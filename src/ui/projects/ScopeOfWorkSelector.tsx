"use client";

import { graphql } from "@/graphql";
import { ScopeOfWorkEnum } from "@/graphql/graphql";
import { useScopeOfWorkSelectorQuery } from "@/graphql/hooks";
import { Check, ChevronDown, Layers, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

graphql(`
  query ScopeOfWorkSelector {
    listScopeOfWorkCodes {
      code
      description
    }
  }
`);

interface ScopeOfWorkOption {
  code: string;
  description: string;
}

export interface ScopeOfWorkSelectorProps {
  value: ScopeOfWorkEnum[];
  onChange: (scopes: ScopeOfWorkEnum[]) => void;
  placeholder?: string;
}

export const ScopeOfWorkSelector: React.FC<ScopeOfWorkSelectorProps> = ({
  value,
  onChange,
  placeholder = "Select scope of work...",
}) => {
  const [search, setSearch] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, loading, error } = useScopeOfWorkSelectorQuery({
    fetchPolicy: "cache-and-network",
  });

  const scopes = useMemo(
    () => (data?.listScopeOfWorkCodes || []).filter(Boolean) as ScopeOfWorkOption[],
    [data],
  );

  // Filter scopes based on search
  const filteredScopes = useMemo(() => {
    if (!search) return scopes;
    const searchLower = search.toLowerCase();
    return scopes.filter(
      (scope) =>
        scope.code.toLowerCase().includes(searchLower) ||
        scope.description.toLowerCase().includes(searchLower),
    );
  }, [scopes, search]);

  // Reset highlighted index when filtered results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredScopes.length]);

  // Calculate dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 400; // max-h-96 = 24rem = 384px
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const shouldFlipUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setDropdownPosition({
        top: shouldFlipUp
          ? rect.top + window.scrollY - dropdownHeight - 4
          : rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  // Update position when opening or on scroll/resize
  useEffect(() => {
    if (popoverOpen) {
      updateDropdownPosition();
      window.addEventListener("scroll", updateDropdownPosition, true);
      window.addEventListener("resize", updateDropdownPosition);
      return () => {
        window.removeEventListener("scroll", updateDropdownPosition, true);
        window.removeEventListener("resize", updateDropdownPosition);
      };
    }
  }, [popoverOpen, updateDropdownPosition]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (popoverOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [popoverOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setPopoverOpen(false);
        setSearch("");
      }
    };

    if (popoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [popoverOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!popoverOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setPopoverOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredScopes.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredScopes[highlightedIndex]) {
          handleToggle(filteredScopes[highlightedIndex].code as ScopeOfWorkEnum);
        }
        break;
      case "Escape":
        e.preventDefault();
        setPopoverOpen(false);
        setSearch("");
        break;
    }
  };

  const handleToggle = (code: ScopeOfWorkEnum) => {
    if (value.includes(code)) {
      onChange(value.filter((s) => s !== code));
    } else {
      onChange([...value, code]);
    }
  };

  const handleRemove = (e: React.MouseEvent, code: ScopeOfWorkEnum) => {
    e.stopPropagation();
    onChange(value.filter((s) => s !== code));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectedScopes = useMemo(
    () => scopes.filter((s) => value.includes(s.code as ScopeOfWorkEnum)),
    [scopes, value],
  );

  const dropdown = popoverOpen ? (
    <div
      ref={dropdownRef}
      className="fixed z-[9999] bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
        marginTop: "4px",
      }}
    >
      {/* Search Input */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <input
          ref={searchInputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search scope of work..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          autoComplete="off"
        />
      </div>

      {/* Scope List */}
      <div className="overflow-y-auto max-h-96">
        {loading ? (
          <div className="px-3 py-8 text-sm text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <p className="mt-2">Loading scopes...</p>
          </div>
        ) : error ? (
          <div className="px-3 py-8 text-sm text-center text-red-500">Error loading scopes</div>
        ) : filteredScopes.length === 0 ? (
          <div className="px-3 py-8 text-sm text-center text-gray-500">
            {search ? "No scopes match your search" : "No scopes available"}
          </div>
        ) : (
          <div className="py-1">
            {filteredScopes.map((scope, index) => {
              const isSelected = value.includes(scope.code as ScopeOfWorkEnum);
              const isHighlighted = index === highlightedIndex;
              return (
                <button
                  key={scope.code}
                  type="button"
                  onClick={() => handleToggle(scope.code as ScopeOfWorkEnum)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                    isSelected
                      ? "bg-blue-50 text-blue-700"
                      : isHighlighted
                        ? "bg-gray-100 text-gray-900"
                        : "hover:bg-gray-50 text-gray-700"
                  }`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div
                    className={`w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center ${
                      isSelected ? "bg-blue-500 border-blue-500" : "border-gray-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 text-left">
                    <div
                      className={`font-mono text-sm font-semibold ${
                        isSelected ? "text-blue-700" : "text-gray-900"
                      }`}
                    >
                      {scope.code}
                    </div>
                    <div
                      className={`text-xs mt-0.5 ${isSelected ? "text-blue-600" : "text-gray-600"}`}
                    >
                      {scope.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div ref={containerRef} className="relative">
        {value.length > 0 ? (
          // Selected state - show selected scopes as compact chips
          <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setPopoverOpen(true)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 text-sm transition-colors hover:bg-blue-100"
            >
              <div className="flex flex-wrap gap-1.5">
                {selectedScopes.map((scope) => (
                  <div
                    key={scope.code}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs"
                  >
                    <span className="font-mono font-semibold">{scope.code}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemove(e, scope.code as ScopeOfWorkEnum)}
                      className="flex-shrink-0 hover:bg-blue-200 rounded transition-colors"
                      aria-label={`Remove ${scope.code}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {value.length > 1 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 px-1.5 py-0.5 text-xs font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </button>
          </div>
        ) : (
          // Input state - show search field
          <button
            type="button"
            onClick={() => setPopoverOpen(true)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 text-sm text-left bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-colors flex items-center justify-between gap-2"
          >
            <span className="text-gray-500 flex-1">{placeholder}</span>
            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
        )}
      </div>

      {/* Render dropdown via portal to avoid layout issues */}
      {typeof document !== "undefined" && dropdown && createPortal(dropdown, document.body)}
    </>
  );
};

export default ScopeOfWorkSelector;
