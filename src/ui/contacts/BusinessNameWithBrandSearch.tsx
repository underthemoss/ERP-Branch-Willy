"use client";

import { useGetBrandByIdQuery, useSearchBrandsQuery } from "@/ui/contacts/api";
import { debounce } from "lodash";
import { Loader2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface BusinessNameWithBrandSearchProps {
  value: string;
  onChange: (value: string) => void;
  brandId: string | null;
  onBrandIdChange: (brandId: string | null) => void;
  onBrandSelected: (brand: any) => void;
  error?: any;
  helperText?: string;
  required?: boolean;
}

export function BusinessNameWithBrandSearch({
  value,
  onChange,
  brandId,
  onBrandIdChange,
  onBrandSelected,
  error,
  helperText,
  required = false,
}: BusinessNameWithBrandSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const textFieldRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fetch brand details when brandId changes
  const { data: brandData } = useGetBrandByIdQuery({
    variables: { brandId: brandId || "" },
    skip: !brandId,
  });

  // Search brands based on query
  const { data: searchData, loading } = useSearchBrandsQuery({
    variables: { query: searchQuery },
    skip: searchQuery.length < 2,
    fetchPolicy: "cache-and-network",
  });

  // Debounce search query
  const debouncedSetSearchQuery = useMemo(
    () =>
      debounce((query: string) => {
        setSearchQuery(query);
        if (query.length >= 2 && !selectedBrand) {
          setIsPopoverOpen(true);
        } else {
          setIsPopoverOpen(false);
        }
      }, 300),
    [selectedBrand],
  );

  useEffect(() => {
    // Only search if no brand is selected
    if (value && !selectedBrand) {
      debouncedSetSearchQuery(value);
    }
  }, [value, selectedBrand, debouncedSetSearchQuery]);

  // When brand data is fetched, update selected brand
  useEffect(() => {
    if (brandData?.getBrandById && !selectedBrand) {
      setSelectedBrand(brandData.getBrandById);
      onBrandSelected(brandData.getBrandById);
    }
  }, [brandData?.getBrandById?.id]); // Only depend on id to avoid infinite loops

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        textFieldRef.current &&
        !textFieldRef.current.contains(event.target as Node)
      ) {
        setIsPopoverOpen(false);
      }
    };

    if (isPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isPopoverOpen]);

  const options = searchData?.searchBrands || [];
  const showPopover = isPopoverOpen && options.length > 0 && !selectedBrand;

  const handleSelectBrand = (brand: any) => {
    setSelectedBrand(brand);
    // Handle both brandId (from search) and id (from getBrandById)
    const brandIdValue = brand.brandId || brand.id;
    onBrandIdChange(brandIdValue);
    onChange(brand.name);
    setIsPopoverOpen(false);

    // Fetch full brand details
    onBrandSelected(brand);
  };

  const handleClearBrand = () => {
    setSelectedBrand(null);
    onBrandIdChange(null);
    onBrandSelected(null);
    setSearchQuery("");
    onChange(""); // Clear the business name field as well
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div className="relative">
      <div ref={textFieldRef} className="relative">
        <input
          type="text"
          value={value}
          onChange={handleTextChange}
          required={required}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
            error ? "border-red-300 focus:ring-red-500" : "border-gray-300"
          } ${loading && !selectedBrand ? "pr-10" : ""}`}
          placeholder="Acme Corporation"
        />
        {loading && !selectedBrand && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Helper text */}
      {(helperText || (!selectedBrand && !error)) && (
        <p className={`mt-1 text-xs ${error ? "text-red-600" : "text-gray-500"}`}>
          {helperText || "Start typing to search for existing brands"}
        </p>
      )}

      {/* Selected brand display */}
      {selectedBrand && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Brand logo/avatar */}
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden ${
                selectedBrand.logos?.find((l: any) => l.type === "logo")?.theme === "dark"
                  ? "bg-white"
                  : selectedBrand.logos?.find((l: any) => l.type === "logo")?.theme === "light"
                    ? "bg-gray-900 border border-gray-300"
                    : "bg-white border border-gray-200"
              }`}
            >
              {selectedBrand.logos?.find((l: any) => l.type === "logo")?.formats?.[0]?.src ||
              selectedBrand.icon ? (
                <img
                  src={
                    selectedBrand.logos?.find((l: any) => l.type === "logo")?.formats?.[0]?.src ||
                    selectedBrand.icon
                  }
                  alt={selectedBrand.name}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <span className="text-xl font-semibold text-gray-700">
                  {selectedBrand.name?.[0] || ""}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              Identified as:{" "}
              <span className="font-semibold text-gray-900">{selectedBrand.name}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClearBrand}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="Clear brand selection"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}

      {/* Search results popover */}
      {showPopover && (
        <div
          ref={popoverRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[300px] overflow-auto"
        >
          <div className="py-1">
            {options.map((brand) => (
              <button
                key={brand?.brandId}
                type="button"
                onClick={() => handleSelectBrand(brand)}
                className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                {/* Brand icon */}
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {brand?.icon ? (
                    <img
                      src={brand.icon}
                      alt={brand?.name || ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-gray-600">
                      {brand?.name?.[0] || ""}
                    </span>
                  )}
                </div>
                {/* Brand info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {brand?.name || ""}
                  </div>
                  {brand?.domain && (
                    <div className="text-xs text-gray-500 truncate">{brand.domain}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
