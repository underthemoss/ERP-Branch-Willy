"use client";

import { ChevronDown, Link, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface RelationshipOption {
  code: string;
  description: string;
}

export interface RelationshipSelectorProps {
  value: string;
  onChange: (relationship: string) => void;
  options: RelationshipOption[];
  placeholder?: string;
  error?: boolean;
}

export const RelationshipSelector: React.FC<RelationshipSelectorProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select relationship...",
  error = false,
}) => {
  const [search, setSearch] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const searchLower = search.toLowerCase();
    return options.filter(
      (option) =>
        option.code.toLowerCase().includes(searchLower) ||
        option.description.toLowerCase().includes(searchLower),
    );
  }, [options, search]);

  // Reset highlighted index when filtered results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length]);

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
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].code);
        }
        break;
      case "Escape":
        e.preventDefault();
        setPopoverOpen(false);
        setSearch("");
        break;
    }
  };

  const handleSelect = (code: string) => {
    onChange(code);
    setPopoverOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const selectedOption = useMemo(() => options.find((o) => o.code === value), [options, value]);

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
          placeholder="Search relationships..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          autoComplete="off"
        />
      </div>

      {/* Options List */}
      <div className="overflow-y-auto max-h-96">
        {filteredOptions.length === 0 ? (
          <div className="px-3 py-8 text-sm text-center text-gray-500">
            {search ? "No relationships match your search" : "No relationships available"}
          </div>
        ) : (
          <div className="py-1">
            {filteredOptions.map((option, index) => {
              const isSelected = value === option.code;
              const isHighlighted = index === highlightedIndex;
              return (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => handleSelect(option.code)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                    isSelected
                      ? "bg-blue-50 text-blue-700"
                      : isHighlighted
                        ? "bg-gray-100 text-gray-900"
                        : "hover:bg-gray-50 text-gray-700"
                  }`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <Link
                    className={`w-4 h-4 flex-shrink-0 ${
                      isSelected ? "text-blue-500" : "text-gray-400"
                    }`}
                  />
                  <div className="flex-1 text-left">
                    <div
                      className={`text-sm font-medium ${
                        isSelected ? "text-blue-700" : "text-gray-900"
                      }`}
                    >
                      {option.description}
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
        {value && selectedOption ? (
          // Selected state - show relationship
          <div
            className={`${
              error ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
            } border rounded-lg overflow-hidden`}
          >
            <button
              type="button"
              onClick={() => setPopoverOpen(true)}
              onKeyDown={handleKeyDown}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                error ? "hover:bg-red-100" : "hover:bg-blue-100"
              }`}
            >
              <Link
                className={`w-4 h-4 flex-shrink-0 ${error ? "text-red-500" : "text-blue-500"}`}
              />
              <span
                className={`flex-1 text-left font-medium ${
                  error ? "text-red-700" : "text-blue-700"
                }`}
              >
                {selectedOption.description}
              </span>
              <button
                type="button"
                onClick={handleClear}
                className={`flex-shrink-0 p-0.5 rounded transition-colors ${
                  error ? "hover:bg-red-200 text-red-600" : "hover:bg-blue-200 text-blue-600"
                }`}
                aria-label="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            </button>
          </div>
        ) : (
          // Input state - show search field
          <button
            type="button"
            onClick={() => setPopoverOpen(true)}
            onKeyDown={handleKeyDown}
            className={`w-full px-3 py-2 text-sm text-left bg-white border rounded-lg focus:ring-2 focus:border-transparent hover:border-gray-400 transition-colors flex items-center justify-between gap-2 ${
              error ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
            }`}
          >
            <span className={error ? "text-red-500 flex-1" : "text-gray-500 flex-1"}>
              {placeholder}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
        )}
      </div>

      {/* Render dropdown via portal to avoid layout issues */}
      {typeof document !== "undefined" && dropdown && createPortal(dropdown, document.body)}
    </>
  );
};

export default RelationshipSelector;
