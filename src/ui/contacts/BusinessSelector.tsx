"use client";

import { useListBusinessContactsQuery } from "@/ui/contacts/api";
import { Building2, ChevronDown, Loader2, MapPin, Phone, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface Business {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  profilePicture?: string;
  brand?: {
    name: string;
    logos?: Array<{
      type: string;
      formats?: Array<{
        src: string;
      }>;
      theme?: string;
    }>;
  };
}

interface BusinessSelectorProps {
  value: string;
  onChange: (businessId: string) => void;
  workspaceId: string;
  required?: boolean;
  error?: boolean;
}

export function BusinessSelector({
  value,
  onChange,
  workspaceId,
  required = false,
  error = false,
}: BusinessSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all businesses
  const { data, loading } = useListBusinessContactsQuery({
    variables: { workspaceId, page: { size: 1000 } },
    fetchPolicy: "cache-and-network",
  });

  const businesses = useMemo(() => {
    return (
      (data?.listContacts?.items
        ?.filter((b) => b?.__typename === "BusinessContact")
        .map((b: any) => ({
          id: b?.id ?? "",
          name: b?.name ?? "",
          phone: b?.phone,
          address: b?.address,
          profilePicture: b?.profilePicture,
          brand: b?.brand,
        })) as Business[]) ?? []
    );
  }, [data]);

  // Filter businesses based on search query
  const filteredBusinesses = useMemo(() => {
    if (!searchQuery.trim()) return businesses;

    const query = searchQuery.toLowerCase();
    return businesses.filter(
      (business) =>
        business.name.toLowerCase().includes(query) ||
        business.address?.toLowerCase().includes(query) ||
        business.phone?.includes(query),
    );
  }, [businesses, searchQuery]);

  // Set selected business when value changes
  useEffect(() => {
    if (value && businesses.length > 0) {
      const business = businesses.find((b) => b.id === value);
      if (business) {
        setSelectedBusiness(business);
      }
    } else if (!value) {
      setSelectedBusiness(null);
      setSearchQuery("");
    }
  }, [value, businesses]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (business: Business) => {
    setSelectedBusiness(business);
    onChange(business.id);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = () => {
    setSelectedBusiness(null);
    onChange("");
    setSearchQuery("");
  };

  const handleInputClick = () => {
    if (!selectedBusiness) {
      setIsOpen(true);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Selected business display */}
      {selectedBusiness ? (
        <div className="relative">
          <div className="flex items-center gap-3 p-3 bg-white border border-gray-300 rounded-lg">
            {/* Business logo/icon */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${
                selectedBusiness.profilePicture ||
                selectedBusiness.brand?.logos?.find((l) => l.type === "logo")?.formats?.[0]?.src
                  ? "bg-white border border-gray-200"
                  : "bg-blue-50"
              }`}
            >
              {selectedBusiness.profilePicture ||
              selectedBusiness.brand?.logos?.find((l) => l.type === "logo")?.formats?.[0]?.src ? (
                <img
                  src={
                    selectedBusiness.profilePicture ||
                    selectedBusiness.brand?.logos?.find((l) => l.type === "logo")?.formats?.[0]
                      ?.src ||
                    ""
                  }
                  alt={selectedBusiness.name}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <Building2 className="w-5 h-5 text-blue-600" />
              )}
            </div>

            {/* Business info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{selectedBusiness.name}</div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                {selectedBusiness.address && (
                  <div className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{selectedBusiness.address}</span>
                  </div>
                )}
                {selectedBusiness.phone && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Phone className="w-3 h-3" />
                    <span>{selectedBusiness.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Clear button */}
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onClick={handleInputClick}
              placeholder="Search businesses..."
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                error ? "border-red-300 focus:ring-red-500" : "border-gray-300"
              }`}
              required={required}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              ) : (
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              )}
            </div>
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div
              ref={dropdownRef}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[400px] overflow-auto"
            >
              {filteredBusinesses.length > 0 ? (
                <div className="py-1">
                  {filteredBusinesses.map((business) => (
                    <button
                      key={business.id}
                      type="button"
                      onClick={() => handleSelect(business)}
                      className="w-full px-3 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      {/* Business logo/icon */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${
                          business.profilePicture ||
                          business.brand?.logos?.find((l) => l.type === "logo")?.formats?.[0]?.src
                            ? "bg-white border border-gray-200"
                            : "bg-blue-50"
                        }`}
                      >
                        {business.profilePicture ||
                        business.brand?.logos?.find((l) => l.type === "logo")?.formats?.[0]?.src ? (
                          <img
                            src={
                              business.profilePicture ||
                              business.brand?.logos?.find((l) => l.type === "logo")?.formats?.[0]
                                ?.src ||
                              ""
                            }
                            alt={business.name}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <Building2 className="w-5 h-5 text-blue-600" />
                        )}
                      </div>

                      {/* Business info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{business.name}</div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          {business.address && (
                            <div className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{business.address}</span>
                            </div>
                          )}
                          {business.phone && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Phone className="w-3 h-3" />
                              <span>{business.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  {searchQuery ? "No businesses found" : "No businesses available"}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {required && !selectedBusiness && (
        <p className="mt-1 text-xs text-gray-500">Please select a business</p>
      )}
    </div>
  );
}
