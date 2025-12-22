"use client";

import * as React from "react";
import { useResourceMapTags } from "./hooks/useResourceMapTags";
import { LocationMapView } from "./LocationMapView";
import { TagDetailDrawer } from "./TagDetailDrawer";
import { TagHierarchyTree } from "./TagHierarchyTree";
import { TagListView } from "./TagListView";
import type { ResourceMapTag } from "./types";

interface LocationsTabProps {
  workspaceId: string;
  viewMode: "tree" | "list";
  searchTerm: string;
}

export function LocationsTab({ workspaceId, viewMode, searchTerm }: LocationsTabProps) {
  const [selectedTagId, setSelectedTagId] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [isCreatingNew, setIsCreatingNew] = React.useState(false);
  const [newTagParentId, setNewTagParentId] = React.useState<string | null>(null);
  const [mapBounds, setMapBounds] = React.useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);

  const { tags, loading, refetch, createTag, updateTagParent, updateTag, deleteTag } =
    useResourceMapTags({
      workspaceId,
      tagType: "LOCATION",
      searchTerm,
    });

  const selectedTag = tags.find((t) => t.id === selectedTagId);

  // Filter tags that have location data for the map
  const tagsWithLocation = React.useMemo(() => {
    return tags.filter((tag) => tag.location?.lat && tag.location?.lng);
  }, [tags]);

  const handleTagSelect = (tagId: string) => {
    setSelectedTagId(tagId);
    setIsCreatingNew(false);
    setNewTagParentId(null);
    setDrawerOpen(true);
  };

  const handleTagMove = async (tagId: string, newParentId: string | null) => {
    await updateTagParent(tagId, newParentId);
  };

  const handleMapBoundsChange = (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => {
    setMapBounds(bounds);
  };

  const handleMarkerClick = (tagId: string) => {
    setSelectedTagId(tagId);
    setIsCreatingNew(false);
    setNewTagParentId(null);
    setDrawerOpen(true);
  };

  const handleAddChild = (parentId: string) => {
    setSelectedTagId(null);
    setIsCreatingNew(true);
    setNewTagParentId(parentId);
    setDrawerOpen(true);
  };

  if (loading && tags.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading locations...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-320px)] min-h-[500px]">
      {/* Left Panel - Tree/List View */}
      <div className="w-1/2 border-r border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-sm font-semibold text-gray-700">
            {viewMode === "tree" ? "Location Hierarchy" : "All Locations"}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {viewMode === "tree" ? "Drag and drop to reorganize" : `${tags.length} locations found`}
          </p>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {viewMode === "tree" ? (
            <TagHierarchyTree
              tags={tags}
              tagType="LOCATION"
              selectedTagId={selectedTagId}
              onTagSelect={handleTagSelect}
              onTagMove={handleTagMove}
              onAddChild={handleAddChild}
              maxDepth={10}
            />
          ) : (
            <TagListView
              tags={tags}
              tagType="LOCATION"
              selectedTagId={selectedTagId}
              onTagSelect={handleTagSelect}
            />
          )}
          {tags.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="text-4xl mb-2">📍</div>
              <p className="text-sm">No locations yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Create your first location to get started
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Map View */}
      <div className="w-1/2 flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-sm font-semibold text-gray-700">Map View</h3>
          <p className="text-xs text-gray-500 mt-1">
            {tagsWithLocation.length} locations with coordinates
          </p>
        </div>
        <div className="flex-1">
          <LocationMapView
            tags={tagsWithLocation}
            selectedTagId={selectedTagId}
            onMarkerClick={handleMarkerClick}
            onBoundsChange={handleMapBoundsChange}
          />
        </div>
      </div>

      {/* Detail Drawer */}
      <TagDetailDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setIsCreatingNew(false);
          setNewTagParentId(null);
        }}
        tag={selectedTag || null}
        tagType="LOCATION"
        onSave={() => {
          refetch();
          setDrawerOpen(false);
          setIsCreatingNew(false);
          setNewTagParentId(null);
        }}
        createTag={createTag}
        updateTag={updateTag}
        deleteTag={deleteTag}
        allTags={tags}
        initialParentId={isCreatingNew ? newTagParentId : undefined}
      />
    </div>
  );
}
