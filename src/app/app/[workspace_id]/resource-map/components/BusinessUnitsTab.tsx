"use client";

import * as React from "react";
import { useResourceMapTags } from "./hooks/useResourceMapTags";
import { TagDetailDrawer } from "./TagDetailDrawer";
import { TagHierarchyTree } from "./TagHierarchyTree";
import { TagListView } from "./TagListView";
import type { ResourceMapTag } from "./types";

interface BusinessUnitsTabProps {
  workspaceId: string;
  viewMode: "tree" | "list";
  searchTerm: string;
}

export function BusinessUnitsTab({ workspaceId, viewMode, searchTerm }: BusinessUnitsTabProps) {
  const [selectedTagId, setSelectedTagId] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const { tags, loading, refetch, updateTagParent } = useResourceMapTags({
    workspaceId,
    tagType: "BUSINESS_UNIT",
    searchTerm,
  });

  const selectedTag = tags.find((t) => t.id === selectedTagId);

  const handleTagSelect = (tagId: string) => {
    setSelectedTagId(tagId);
    setDrawerOpen(true);
  };

  const handleTagMove = async (tagId: string, newParentId: string | null) => {
    await updateTagParent(tagId, newParentId);
  };

  if (loading && tags.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading business units...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-320px)] min-h-[500px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-sm font-semibold text-gray-700">
          {viewMode === "tree" ? "Business Unit Hierarchy" : "All Business Units"}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {viewMode === "tree"
            ? "Drag and drop to reorganize your organizational structure"
            : `${tags.length} business units found`}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {viewMode === "tree" ? (
          <TagHierarchyTree
            tags={tags}
            tagType="BUSINESS_UNIT"
            selectedTagId={selectedTagId}
            onTagSelect={handleTagSelect}
            onTagMove={handleTagMove}
            maxDepth={10}
          />
        ) : (
          <TagListView
            tags={tags}
            tagType="BUSINESS_UNIT"
            selectedTagId={selectedTagId}
            onTagSelect={handleTagSelect}
          />
        )}

        {tags.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-4xl mb-2">🏢</div>
            <p className="text-sm">No business units yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Create your first business unit to define your organizational structure
            </p>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <TagDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        tag={selectedTag || null}
        tagType="BUSINESS_UNIT"
        onSave={() => {
          refetch();
          setDrawerOpen(false);
        }}
      />
    </div>
  );
}
