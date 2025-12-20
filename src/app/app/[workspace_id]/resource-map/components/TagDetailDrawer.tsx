"use client";

import {
  Building2,
  ChevronRight,
  Globe,
  Hash,
  Map as MapIcon,
  MapPin,
  Save,
  Target,
  Trash2,
  Users,
  X,
} from "lucide-react";
import * as React from "react";
import { LocationMetadataForm } from "./LocationMetadataForm";
import type {
  LocationMetadata,
  LocationMetadataKind,
  ResourceMapTag,
  ResourceMapTagType,
} from "./types";

interface TagDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  tag: ResourceMapTag | null;
  tagType: ResourceMapTagType;
  onSave: () => void;
  createTag?: (
    value: string,
    parentId?: string | null,
    locationMetadata?: LocationMetadata | null,
  ) => Promise<ResourceMapTag | null>;
  allTags?: ResourceMapTag[];
}

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

// Get label for tag type
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

export function TagDetailDrawer({
  open,
  onClose,
  tag,
  tagType,
  onSave,
  createTag,
  allTags = [],
}: TagDetailDrawerProps) {
  const [formData, setFormData] = React.useState({
    value: "",
    parentId: null as string | null,
    locationMetadata: null as LocationMetadata | null,
  });
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const Icon = getTagIcon(tagType);
  const isNewTag = !tag;

  // Reset form when tag changes
  React.useEffect(() => {
    if (tag) {
      setFormData({
        value: tag.value,
        parentId: tag.parentId,
        locationMetadata: tag.locationMetadata || null,
      });
      setIsEditing(false);
    } else {
      setFormData({
        value: "",
        parentId: null,
        locationMetadata: null,
      });
      setIsEditing(true);
    }
  }, [tag]);

  const handleSave = async () => {
    if (!formData.value.trim()) return;

    setIsSaving(true);
    try {
      if (isNewTag && createTag) {
        // Create a new tag
        console.log("Creating tag:", formData);
        await createTag(formData.value, formData.parentId, formData.locationMetadata);
      } else {
        // TODO: Update existing tag
        console.log("Updating tag:", formData);
      }
      onSave();
    } catch (error) {
      console.error("Failed to save tag:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!tag || !confirm(`Are you sure you want to delete "${tag.value}"?`)) {
      return;
    }

    try {
      // TODO: Call delete mutation
      console.log("Deleting tag:", tag.id);
      onSave();
    } catch (error) {
      console.error("Failed to delete tag:", error);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[450px] bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                {isNewTag ? `New ${getTagTypeLabel(tagType)}` : tag?.value || "Details"}
              </h2>
              <p className="text-xs text-gray-500">{getTagTypeLabel(tagType)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Path Breadcrumb */}
          {tag && tag.path.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Hierarchy Path
              </p>
              <div className="flex items-center flex-wrap gap-1">
                {tag.path.map((segment, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <ChevronRight className="w-3 h-3 text-gray-300" />}
                    <span
                      className={`text-sm px-2 py-0.5 rounded ${
                        index === tag.path.length - 1
                          ? "bg-blue-100 text-blue-700 font-medium"
                          : "text-gray-600"
                      }`}
                    >
                      {segment}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Name Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              disabled={!isEditing}
              placeholder={`Enter ${getTagTypeLabel(tagType).toLowerCase()} name`}
              className={`
                w-full px-3 py-2 border rounded-lg text-sm
                ${isEditing ? "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" : "border-gray-200 bg-gray-50 text-gray-600"}
              `}
            />
          </div>

          {/* Parent Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent {getTagTypeLabel(tagType)}
            </label>
            <select
              value={formData.parentId || ""}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
              disabled={!isEditing}
              className={`
                w-full px-3 py-2 border rounded-lg text-sm
                ${isEditing ? "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" : "border-gray-200 bg-gray-50 text-gray-600"}
              `}
            >
              <option value="">No parent (root level)</option>
              {allTags
                .filter((t) => t.id !== tag?.id) // Can't be parent of itself
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.path.length > 0 ? t.path.join(" > ") : t.value}
                  </option>
                ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select a parent to nest this {getTagTypeLabel(tagType).toLowerCase()} under
            </p>
          </div>

          {/* Location Metadata (only for LOCATION type) */}
          {tagType === "LOCATION" && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <MapIcon className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-700">Location Metadata</h3>
              </div>

              {isEditing ? (
                <LocationMetadataForm
                  value={formData.locationMetadata}
                  onChange={(metadata: LocationMetadata | null) =>
                    setFormData({ ...formData, locationMetadata: metadata })
                  }
                />
              ) : (
                <LocationMetadataDisplay metadata={tag?.locationMetadata} />
              )}
            </div>
          )}

          {/* Metadata */}
          {tag && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Metadata</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">ID</span>
                  <span className="font-mono text-xs text-gray-600">{tag.id}</span>
                </div>
                {tag.hierarchyId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hierarchy ID</span>
                    <span className="font-mono text-xs text-gray-600">{tag.hierarchyId}</span>
                  </div>
                )}
                {tag.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created</span>
                    <span className="text-gray-600">
                      {new Date(tag.createdAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {tag.updatedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Updated</span>
                    <span className="text-gray-600">
                      {new Date(tag.updatedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              {tag && !isEditing && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      if (tag) {
                        setFormData({
                          value: tag.value,
                          parentId: tag.parentId,
                          locationMetadata: tag.locationMetadata || null,
                        });
                        setIsEditing(false);
                      } else {
                        onClose();
                      }
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!formData.value.trim() || isSaving}
                    className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Display component for location metadata (read-only)
function LocationMetadataDisplay({ metadata }: { metadata?: LocationMetadata | null }) {
  if (!metadata) {
    return (
      <div className="text-center py-6 text-gray-400">
        <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No location data</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">Type:</span>
        <span className="font-medium text-gray-700 capitalize">
          {metadata.kind.toLowerCase().replace("_", " ")}
        </span>
      </div>

      {metadata.kind === "ADDRESS" && metadata.address && (
        <div className="p-3 bg-gray-50 rounded-lg text-sm">
          {metadata.address.line1 && <p>{metadata.address.line1}</p>}
          {metadata.address.line2 && <p>{metadata.address.line2}</p>}
          <p>
            {[metadata.address.city, metadata.address.state, metadata.address.postalCode]
              .filter(Boolean)
              .join(", ")}
          </p>
          {metadata.address.country && <p>{metadata.address.country}</p>}
        </div>
      )}

      {metadata.kind === "LAT_LNG" && metadata.latLng && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4 text-gray-400" />
            <span>
              {metadata.latLng.lat.toFixed(6)}, {metadata.latLng.lng.toFixed(6)}
            </span>
          </div>
          {metadata.latLng.accuracyMeters && (
            <p className="text-xs text-gray-500 mt-1">
              Accuracy: ±{metadata.latLng.accuracyMeters}m
            </p>
          )}
        </div>
      )}

      {metadata.kind === "PLUS_CODE" && metadata.plusCode && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Hash className="w-4 h-4 text-gray-400" />
            <span className="font-mono">{metadata.plusCode.code}</span>
          </div>
          {metadata.plusCode.localArea && (
            <p className="text-xs text-gray-500 mt-1">{metadata.plusCode.localArea}</p>
          )}
        </div>
      )}

      {metadata.kind === "GEOFENCE" && metadata.geofence && (
        <div className="p-3 bg-gray-50 rounded-lg text-sm">
          <p className="font-medium capitalize">{metadata.geofence.type.toLowerCase()} Geofence</p>
          {metadata.geofence.type === "CIRCLE" && metadata.geofence.radiusMeters && (
            <p className="text-gray-500 mt-1">Radius: {metadata.geofence.radiusMeters}m</p>
          )}
          {metadata.geofence.type === "POLYGON" && metadata.geofence.points && (
            <p className="text-gray-500 mt-1">{metadata.geofence.points.length} points</p>
          )}
        </div>
      )}
    </div>
  );
}
