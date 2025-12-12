"use client";

import { graphql } from "@/graphql";
import { ProjectStatusEnum } from "@/graphql/graphql";
import { useProjectStatusSelectorQuery } from "@/graphql/hooks";
import { CheckSquare, ChevronDown, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

graphql(`
  query ProjectStatusSelector {
    listProjectStatusCodes {
      code
      description
    }
  }
`);

interface ProjectStatusOption {
  code: string;
  description: string;
}

export interface ProjectStatusSelectorProps {
  value?: ProjectStatusEnum | "";
  onChange: (status: ProjectStatusEnum | "") => void;
  placeholder?: string;
}

export const ProjectStatusSelector: React.FC<ProjectStatusSelectorProps> = ({
  value,
  onChange,
  placeholder = "Select status...",
}) => {
  const [search, setSearch] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, loading, error } = useProjectStatusSelectorQuery({
    fetchPolicy: "cache-and-network",
  });

  const statuses = useMemo(
    () => (data?.listProjectStatusCodes || []).filter(Boolean) as ProjectStatusOption[],
    [data],
  );

  // Filter statuses based on search
  const filteredStatuses = useMemo(() => {
    if (!search) return statuses;
    const searchLower = search.toLowerCase();
    return statuses.filter(
      (status) =>
        status.code.toLowerCase().includes(searchLower) ||
        status.description.toLowerCase().includes(searchLower),
    );
  }, [statuses, search]);

  // Reset highlighted index when filtered results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredStatuses.length]);

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
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredStatuses.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredStatuses[highlightedIndex]) {
          handleSelect(filteredStatuses[highlightedIndex].code as ProjectStatusEnum);
        }
        break;
      case "Escape":
        e.preventDefault();
        setPopoverOpen(false);
        setSearch("");
        break;
    }
  };

  const handleSelect = (code: ProjectStatusEnum) => {
    onChange(code);
    setPopoverOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const selectedStatus = useMemo(() => statuses.find((s) => s.code === value), [statuses, value]);

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
          placeholder="Search statuses..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          autoComplete="off"
        />
      </div>

      {/* Status List */}
      <div className="overflow-y-auto max-h-96">
        {loading ? (
          <div className="px-3 py-8 text-sm text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <p className="mt-2">Loading statuses...</p>
          </div>
        ) : error ? (
          <div className="px-3 py-8 text-sm text-center text-red-500">Error loading statuses</div>
        ) : filteredStatuses.length === 0 ? (
          <div className="px-3 py-8 text-sm text-center text-gray-500">
            {search ? "No statuses match your search" : "No statuses available"}
          </div>
        ) : (
          <div className="py-1">
            {filteredStatuses.map((status, index) => {
              const isSelected = value === status.code;
              const isHighlighted = index === highlightedIndex;
              return (
                <button
                  key={status.code}
                  type="button"
                  onClick={() => handleSelect(status.code as ProjectStatusEnum)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                    isSelected
                      ? "bg-blue-50 text-blue-700"
                      : isHighlighted
                        ? "bg-gray-100 text-gray-900"
                        : "hover:bg-gray-50 text-gray-700"
                  }`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <CheckSquare
                    className={`w-4 h-4 flex-shrink-0 ${
                      isSelected ? "text-blue-500" : "text-gray-400"
                    }`}
                  />
                  <div className="flex-1 text-left">
                    <div
                      className={`font-mono text-sm font-semibold ${
                        isSelected ? "text-blue-700" : "text-gray-900"
                      }`}
                    >
                      {status.code}
                    </div>
                    <div
                      className={`text-xs mt-0.5 ${isSelected ? "text-blue-600" : "text-gray-600"}`}
                    >
                      {status.description}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                  )}
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
        {value && selectedStatus ? (
          // Selected state - show status with code and description
          <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setPopoverOpen(true)}
              onKeyDown={handleKeyDown}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-blue-100"
            >
              <CheckSquare className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div className="flex-1 text-left">
                <div className="font-mono text-sm font-semibold text-blue-700">
                  {selectedStatus.code}
                </div>
                <div className="text-xs text-blue-600 mt-0.5">{selectedStatus.description}</div>
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="flex-shrink-0 p-0.5 hover:bg-blue-200 rounded transition-colors"
                aria-label="Clear selection"
              >
                <X className="w-4 h-4 text-blue-600" />
              </button>
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

export default ProjectStatusSelector;
