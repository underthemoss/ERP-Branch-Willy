"use client";

import { ResourceMapTagType, useListResourceMapEntriesByTagTypeQuery } from "@/graphql/hooks";
import { Building2, Check, ChevronDown, Loader2, MapPin, Users, X } from "lucide-react";
import * as React from "react";

// Re-export the type for convenience
export { ResourceMapTagType } from "@/graphql/hooks";

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
  /** Single select mode for specific types (e.g., ROLE should be single-select) */
  singleSelectTypes?: ResourceMapTagType[];
  /** Callback to get the selected role tag value (for mutation compatibility) */
  onRoleChange?: (roleValue: string | null) => void;
}

// Icon helper for tag types
function getTagTypeIcon(tagType: ResourceMapTagType) {
  switch (tagType) {
    case ResourceMapTagType.Location:
      return MapPin;
    case ResourceMapTagType.BusinessUnit:
      return Building2;
    case ResourceMapTagType.Role:
      return Users;
    default:
      return MapPin;
  }
}

// Label helper for tag types
function getTagTypeLabel(tagType: ResourceMapTagType): string {
  switch (tagType) {
    case ResourceMapTagType.Location:
      return "Location";
    case ResourceMapTagType.BusinessUnit:
      return "Business Unit";
    case ResourceMapTagType.Role:
      return "Role";
    default:
      return "Tag";
  }
}

// Color helper for tag type chips
function getTagTypeColors(tagType: ResourceMapTagType): {
  bg: string;
  text: string;
  border: string;
  hoverBg: string;
} {
  switch (tagType) {
    case ResourceMapTagType.Location:
      return {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        hoverBg: "hover:bg-blue-100",
      };
    case ResourceMapTagType.BusinessUnit:
      return {
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
        hoverBg: "hover:bg-purple-100",
      };
    case ResourceMapTagType.Role:
      return {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
        hoverBg: "hover:bg-green-100",
      };
    default:
      return {
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
        hoverBg: "hover:bg-gray-100",
      };
  }
}

interface TagOption {
  id: string;
  value: string;
  tagType: ResourceMapTagType;
  path?: string[];
  hierarchyName?: string;
}

/**
 * ContactTagsSelector - Multi-select component for resource map tags organized by type
 *
 * For Person contacts: Use with allowedTypes=[LOCATION, BUSINESS_UNIT, ROLE]
 * For Business contacts: Use with allowedTypes=[LOCATION, BUSINESS_UNIT]
 *
 * ROLE is typically single-select, while LOCATION and BUSINESS_UNIT are multi-select
 */
export function ContactTagsSelector({
  selectedIds,
  onChange,
  allowedTypes,
  readonly = false,
  label,
  compact = false,
  singleSelectTypes = [ResourceMapTagType.Role],
  onRoleChange,
}: ContactTagsSelectorProps) {
  const [expandedTypes, setExpandedTypes] = React.useState<Set<ResourceMapTagType>>(
    new Set(allowedTypes),
  );

  // Fetch all tags for the allowed types
  const { data, loading, error } = useListResourceMapEntriesByTagTypeQuery({
    variables: { types: allowedTypes },
    fetchPolicy: "cache-and-network",
  });

  // Transform data into grouped tag options
  const tagsByType = React.useMemo(() => {
    const grouped = new Map<ResourceMapTagType, TagOption[]>();

    // Initialize all allowed types with empty arrays
    allowedTypes.forEach((type) => grouped.set(type, []));

    if (data?.listResourceMapEntriesByTagType) {
      data.listResourceMapEntriesByTagType.forEach((entry) => {
        if (entry && entry.tagType && entry.id && entry.value) {
          const existing = grouped.get(entry.tagType) || [];
          existing.push({
            id: entry.id,
            value: entry.value,
            tagType: entry.tagType,
            path: entry.path?.filter((p): p is string => p !== null) || [],
            hierarchyName: entry.hierarchy_name || undefined,
          });
          grouped.set(entry.tagType, existing);
        }
      });
    }

    return grouped;
  }, [data, allowedTypes]);

  // Get selected tags for display
  const selectedTags = React.useMemo(() => {
    const allTags: TagOption[] = [];
    tagsByType.forEach((tags) => allTags.push(...tags));
    return allTags.filter((tag) => selectedIds.includes(tag.id));
  }, [tagsByType, selectedIds]);

  // Handle tag selection
  const handleTagToggle = (tag: TagOption) => {
    if (readonly) return;

    const isSingleSelect = singleSelectTypes.includes(tag.tagType);
    const isSelected = selectedIds.includes(tag.id);

    let newIds: string[];

    if (isSingleSelect) {
      // For single-select types, remove any existing selection of this type and add/remove the new one
      const otherTypeIds = selectedIds.filter((id) => {
        const existingTag = Array.from(tagsByType.values())
          .flat()
          .find((t) => t.id === id);
        return existingTag?.tagType !== tag.tagType;
      });

      if (isSelected) {
        newIds = otherTypeIds;
        if (tag.tagType === ResourceMapTagType.Role && onRoleChange) {
          onRoleChange(null);
        }
      } else {
        newIds = [...otherTypeIds, tag.id];
        if (tag.tagType === ResourceMapTagType.Role && onRoleChange) {
          onRoleChange(tag.value);
        }
      }
    } else {
      // For multi-select types, toggle the selection
      if (isSelected) {
        newIds = selectedIds.filter((id) => id !== tag.id);
      } else {
        newIds = [...selectedIds, tag.id];
      }
    }

    onChange(newIds);
  };

  // Toggle type section expansion
  const toggleTypeExpanded = (type: ResourceMapTagType) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Remove a selected tag
  const removeTag = (tagId: string) => {
    if (readonly) return;

    const tag = selectedTags.find((t) => t.id === tagId);
    if (tag?.tagType === ResourceMapTagType.Role && onRoleChange) {
      onRoleChange(null);
    }

    onChange(selectedIds.filter((id) => id !== tagId));
  };

  // Loading state
  if (loading && !data) {
    return (
      <div className="space-y-2">
        {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
        <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          <span className="text-sm text-gray-500">Loading tags...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-2">
        {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-sm text-red-600">Failed to load tags: {error.message}</span>
        </div>
      </div>
    );
  }

  // Compact mode - just show selected chips
  if (compact && readonly) {
    return (
      <div className="flex flex-wrap gap-2">
        {selectedTags.length === 0 ? (
          <span className="text-sm text-gray-400">No tags assigned</span>
        ) : (
          selectedTags.map((tag) => {
            const colors = getTagTypeColors(tag.tagType);
            const Icon = getTagTypeIcon(tag.tagType);
            return (
              <span
                key={tag.id}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}
              >
                <Icon className="w-3 h-3" />
                {tag.value}
              </span>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {selectedTags.map((tag) => {
            const colors = getTagTypeColors(tag.tagType);
            const Icon = getTagTypeIcon(tag.tagType);
            return (
              <span
                key={tag.id}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}
              >
                <Icon className="w-3 h-3" />
                {tag.value}
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => removeTag(tag.id)}
                    className="ml-0.5 hover:opacity-70 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* Tag selection dropdowns by type */}
      {!readonly && (
        <div className="space-y-2">
          {allowedTypes.map((type) => {
            const tags = tagsByType.get(type) || [];
            const Icon = getTagTypeIcon(type);
            const colors = getTagTypeColors(type);
            const isExpanded = expandedTypes.has(type);
            const isSingleSelect = singleSelectTypes.includes(type);
            const selectedOfType = selectedTags.filter((t) => t.tagType === type);

            return (
              <div key={type} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Type header */}
                <button
                  type="button"
                  onClick={() => toggleTypeExpanded(type)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${colors.text}`} />
                    <span className="text-sm font-medium text-gray-700">
                      {getTagTypeLabel(type)}
                    </span>
                    {isSingleSelect && <span className="text-xs text-gray-400">(select one)</span>}
                    {selectedOfType.length > 0 && (
                      <span
                        className={`px-1.5 py-0.5 text-xs font-medium rounded ${colors.bg} ${colors.text}`}
                      >
                        {selectedOfType.length}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Tag options */}
                {isExpanded && (
                  <div className="border-t border-gray-200 max-h-48 overflow-y-auto">
                    {tags.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-gray-400">
                        No {getTagTypeLabel(type).toLowerCase()} tags available
                      </div>
                    ) : (
                      <div className="py-1">
                        {tags.map((tag) => {
                          const isSelected = selectedIds.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => handleTagToggle(tag)}
                              className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                                isSelected ? "bg-gray-50" : ""
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded ${isSingleSelect ? "rounded-full" : ""} border-2 flex items-center justify-center ${
                                  isSelected
                                    ? `${colors.bg} ${colors.border} ${colors.text}`
                                    : "border-gray-300"
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-gray-700">{tag.value}</span>
                                {tag.path && tag.path.length > 1 && (
                                  <span className="block text-xs text-gray-400 truncate">
                                    {tag.path.slice(0, -1).join(" › ")}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Validation hint */}
      {!readonly && selectedIds.length === 0 && (
        <p className="text-xs text-gray-500">Select at least one location or business unit tag</p>
      )}
    </div>
  );
}

export default ContactTagsSelector;
