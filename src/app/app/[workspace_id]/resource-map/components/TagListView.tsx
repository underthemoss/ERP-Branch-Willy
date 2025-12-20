"use client";

import {
  ArrowUpDown,
  Building2,
  ChevronRight,
  Copy,
  Edit,
  MapPin,
  MoreVertical,
  Trash2,
  Users,
} from "lucide-react";
import * as React from "react";
import type { ResourceMapTag, ResourceMapTagType } from "./types";

interface TagListViewProps {
  tags: ResourceMapTag[];
  tagType: ResourceMapTagType;
  selectedTagId: string | null;
  onTagSelect: (tagId: string) => void;
}

type SortField = "value" | "path" | "createdAt";
type SortDirection = "asc" | "desc";

// Get icon for tag type
function getTagIcon(tagType: ResourceMapTagType) {
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

export function TagListView({ tags, tagType, selectedTagId, onTagSelect }: TagListViewProps) {
  const [sortField, setSortField] = React.useState<SortField>("value");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc");
  const [contextMenuId, setContextMenuId] = React.useState<string | null>(null);

  const Icon = getTagIcon(tagType);

  // Sort tags
  const sortedTags = React.useMemo(() => {
    return [...tags].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "value":
          comparison = a.value.localeCompare(b.value);
          break;
        case "path":
          comparison = a.path.join(" > ").localeCompare(b.path.join(" > "));
          break;
        case "createdAt":
          comparison = (a.createdAt || "").localeCompare(b.createdAt || "");
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [tags, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleContextMenu = (e: React.MouseEvent, tagId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuId(contextMenuId === tagId ? null : tagId);
  };

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClick = () => setContextMenuId(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 px-4 py-2">
          <div className="col-span-4">
            <button
              onClick={() => handleSort("value")}
              className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-800"
            >
              Name
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
          <div className="col-span-5">
            <button
              onClick={() => handleSort("path")}
              className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-800"
            >
              Hierarchy Path
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
          <div className="col-span-2">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {tagType === "LOCATION" ? "Location" : "Parent"}
            </span>
          </div>
          <div className="col-span-1 text-right">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Actions
            </span>
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-100">
        {sortedTags.map((tag) => {
          const isSelected = selectedTagId === tag.id;
          const hasLocation = tag.location?.lat && tag.location?.lng;

          return (
            <div
              key={tag.id}
              onClick={() => onTagSelect(tag.id)}
              className={`
                grid grid-cols-12 gap-4 px-4 py-3 cursor-pointer transition-colors
                ${isSelected ? "bg-blue-50 border-l-2 border-blue-500" : "hover:bg-gray-50 border-l-2 border-transparent"}
              `}
            >
              {/* Name */}
              <div className="col-span-4 flex items-center gap-2 min-w-0">
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${hasLocation ? "text-green-500" : "text-gray-400"}`}
                />
                <span className="text-sm font-medium text-gray-900 truncate">{tag.value}</span>
              </div>

              {/* Hierarchy Path */}
              <div className="col-span-5 flex items-center gap-1 min-w-0 overflow-hidden">
                {tag.path.map((segment, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />}
                    <span
                      className={`text-xs truncate ${
                        index === tag.path.length - 1
                          ? "text-gray-700 font-medium"
                          : "text-gray-400"
                      }`}
                    >
                      {segment}
                    </span>
                  </React.Fragment>
                ))}
              </div>

              {/* Location / Parent Info */}
              <div className="col-span-2 flex items-center">
                {tagType === "LOCATION" && hasLocation ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <MapPin className="w-3 h-3" />
                    Located
                  </span>
                ) : tag.parentId ? (
                  <span className="text-xs text-gray-500 truncate">
                    {tags.find((t) => t.id === tag.parentId)?.value || "—"}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Root</span>
                )}
              </div>

              {/* Actions */}
              <div className="col-span-1 flex items-center justify-end relative">
                <button
                  onClick={(e) => handleContextMenu(e, tag.id)}
                  className="p-1 rounded hover:bg-gray-200 transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>

                {/* Context Menu */}
                {contextMenuId === tag.id && (
                  <div
                    className="absolute right-0 top-full mt-1 z-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        onTagSelect(tag.id);
                        setContextMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement duplicate
                        setContextMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Copy className="w-4 h-4" />
                      Duplicate
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => {
                        // TODO: Implement delete
                        setContextMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          {sortedTags.length} {tagType.toLowerCase().replace("_", " ")}
          {sortedTags.length !== 1 ? "s" : ""} •{" "}
          {tagType === "LOCATION" &&
            `${sortedTags.filter((t) => t.location?.lat).length} with location data`}
          {tagType !== "LOCATION" &&
            `${sortedTags.filter((t) => !t.parentId).length} at root level`}
        </p>
      </div>
    </div>
  );
}
