"use client";

import { Building2, Loader2, MapPin, Users } from "lucide-react";
import * as React from "react";

// =============================================================================
// TODO: When backend deploys ResourceMapTagType and listResourceMapEntriesByTagType,
// uncomment the imports and implement the full component.
// =============================================================================

/*
import {
  ResourceMapTagType,
  useListResourceMapEntriesByTagTypeQuery,
} from "@/graphql/hooks";
*/

// Temporary local type definition until backend deploys
export type ResourceMapTagType = "LOCATION" | "BUSINESS_UNIT" | "ROLE";

interface ContactTagsSelectorProps {
  /** Currently selected tag IDs */
  selectedIds: string[];
  /** Callback when selection changes */
  onChange: (ids: string[]) => void;
  /** Which tag types to show - Person contacts: all 3, Business contacts: LOCATION + BUSINESS_UNIT */
  allowedTypes: ResourceMapTagType[];
  /** Whether the selector is read-only */
  readonly?: boolean;
  /** Optional label */
  label?: string;
  /** Whether to show as compact chips only */
  compact?: boolean;
}

// Icon helper for tag types
function getTagTypeIcon(tagType: ResourceMapTagType) {
  switch (tagType) {
    case "LOCATION":
      return MapPin;
    case "BUSINESS_UNIT":
      return Building2;
    case "ROLE":
      return Users;
    default:
      return MapPin;
  }
}

// Label helper for tag types
function getTagTypeLabel(tagType: ResourceMapTagType): string {
  switch (tagType) {
    case "LOCATION":
      return "Location";
    case "BUSINESS_UNIT":
      return "Business Unit";
    case "ROLE":
      return "Role";
    default:
      return "Tag";
  }
}

/**
 * ContactTagsSelector - Multi-select component for resource map tags organized by type
 *
 * STUB VERSION: This component is a placeholder until the backend deploys:
 * - ResourceMapTagType enum
 * - listResourceMapEntriesByTagType query
 *
 * For Person contacts: Use with allowedTypes=["LOCATION", "BUSINESS_UNIT", "ROLE"]
 * For Business contacts: Use with allowedTypes=["LOCATION", "BUSINESS_UNIT"]
 */
export function ContactTagsSelector({
  selectedIds,
  onChange,
  allowedTypes,
  readonly = false,
  label = "Tags",
  compact = false,
}: ContactTagsSelectorProps) {
  // Show a placeholder message until backend is deployed
  return (
    <div className="space-y-3">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      <div className="p-4 bg-gray-50 border border-gray-200 border-dashed rounded-lg">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4" />
          <span>Tag management is coming soon</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          This feature is pending backend deployment. Available tag types will include:
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {allowedTypes.map((type) => {
            const Icon = getTagTypeIcon(type);
            return (
              <span
                key={type}
                className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600"
              >
                <Icon className="w-3 h-3" />
                {getTagTypeLabel(type)}
              </span>
            );
          })}
        </div>
      </div>

      {!readonly && selectedIds.length > 0 && (
        <p className="text-xs text-gray-500">
          {selectedIds.length} tag{selectedIds.length !== 1 ? "s" : ""} pre-selected
        </p>
      )}
    </div>
  );
}

export default ContactTagsSelector;
