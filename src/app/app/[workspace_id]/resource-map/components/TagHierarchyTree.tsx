"use client";

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  GripVertical,
  MapPin,
  Users,
} from "lucide-react";
import * as React from "react";
import type { ResourceMapTag, ResourceMapTagType, TreeNode } from "./types";

interface TagHierarchyTreeProps {
  tags: ResourceMapTag[];
  tagType: ResourceMapTagType;
  selectedTagId: string | null;
  onTagSelect: (tagId: string) => void;
  onTagMove: (tagId: string, newParentId: string | null) => Promise<void>;
  maxDepth?: number;
}

// Build tree structure from flat list
function buildTree(
  tags: ResourceMapTag[],
  expandedIds: Set<string>,
  parentId: string | null = null,
  depth: number = 0,
): TreeNode[] {
  return tags
    .filter((tag) => tag.parentId === parentId)
    .map((tag) => ({
      id: tag.id,
      label: tag.value,
      parentId: tag.parentId,
      depth,
      data: tag,
      isExpanded: expandedIds.has(tag.id),
      children: buildTree(tags, expandedIds, tag.id, depth + 1),
    }));
}

// Flatten tree for sortable context
function flattenTree(nodes: TreeNode[]): TreeNode[] {
  return nodes.reduce<TreeNode[]>((acc, node) => {
    acc.push(node);
    if (node.isExpanded && node.children.length > 0) {
      acc.push(...flattenTree(node.children));
    }
    return acc;
  }, []);
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
      return FolderOpen;
  }
}

// Sortable Tree Node Component
interface SortableTreeNodeProps {
  node: TreeNode;
  tagType: ResourceMapTagType;
  selectedTagId: string | null;
  onTagSelect: (tagId: string) => void;
  onToggleExpand: (tagId: string) => void;
  isDragging?: boolean;
  isOverlay?: boolean;
  isDropTarget?: boolean;
  maxDepth: number;
}

function SortableTreeNode({
  node,
  tagType,
  selectedTagId,
  onTagSelect,
  onToggleExpand,
  isDragging = false,
  isOverlay = false,
  isDropTarget = false,
  maxDepth,
}: SortableTreeNodeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: node.id,
    data: {
      type: "tree-node",
      node,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = getTagIcon(tagType);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedTagId === node.id;
  const canHaveChildren = node.depth < maxDepth;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ${isDragging || isSortableDragging ? "opacity-50" : ""}
        ${isOverlay ? "shadow-lg bg-white rounded-lg border-2 border-blue-500" : ""}
      `}
    >
      <div
        className={`
          flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer
          transition-colors duration-150 group
          ${isSelected ? "bg-blue-100 border border-blue-300" : "hover:bg-gray-100 border border-transparent"}
          ${isDropTarget ? "bg-blue-50 border-2 border-dashed border-blue-400" : ""}
        `}
        style={{ marginLeft: `${node.depth * 20}px` }}
        onClick={() => onTagSelect(node.id)}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-3 h-3 text-gray-400" />
        </div>

        {/* Expand/Collapse Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) {
              onToggleExpand(node.id);
            }
          }}
          className={`p-0.5 rounded hover:bg-gray-200 ${!hasChildren ? "invisible" : ""}`}
        >
          {node.isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {/* Folder/Item Icon */}
        {hasChildren ? (
          node.isExpanded ? (
            <FolderOpen className="w-4 h-4 text-amber-500" />
          ) : (
            <Folder className="w-4 h-4 text-amber-500" />
          )
        ) : (
          <Icon className="w-4 h-4 text-blue-500" />
        )}

        {/* Label */}
        <span className="text-sm text-gray-800 flex-1 truncate">{node.label}</span>

        {/* Children count badge */}
        {hasChildren && (
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            {node.children.length}
          </span>
        )}

        {/* Drop indicator for nesting */}
        {canHaveChildren && (
          <div className="w-4 h-4 opacity-0 group-hover:opacity-30 text-blue-500">+</div>
        )}
      </div>
    </div>
  );
}

// Drag Overlay Component
function DragOverlayContent({ node, tagType }: { node: TreeNode; tagType: ResourceMapTagType }) {
  const Icon = getTagIcon(tagType);
  return (
    <div className="flex items-center gap-2 py-1.5 px-3 bg-white rounded-lg shadow-lg border-2 border-blue-500">
      <Icon className="w-4 h-4 text-blue-500" />
      <span className="text-sm font-medium text-gray-800">{node.label}</span>
    </div>
  );
}

export function TagHierarchyTree({
  tags,
  tagType,
  selectedTagId,
  onTagSelect,
  onTagMove,
  maxDepth = 10,
}: TagHierarchyTreeProps) {
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = React.useState<UniqueIdentifier | null>(null);

  // Build tree structure
  const tree = React.useMemo(() => buildTree(tags, expandedIds), [tags, expandedIds]);
  const flatNodes = React.useMemo(() => flattenTree(tree), [tree]);

  // Find active node for drag overlay
  const activeNode = React.useMemo(() => {
    if (!activeId) return null;
    return flatNodes.find((n) => n.id === activeId) || null;
  }, [activeId, flatNodes]);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
  );

  const handleToggleExpand = (tagId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setOverId(null);

    if (!over || active.id === over.id) return;

    const draggedNode = flatNodes.find((n) => n.id === active.id);
    const targetNode = flatNodes.find((n) => n.id === over.id);

    if (!draggedNode || !targetNode) return;

    // Prevent circular references
    const isDescendant = (parentId: string, childId: string): boolean => {
      const child = tags.find((t) => t.id === childId);
      if (!child) return false;
      if (child.parentId === parentId) return true;
      if (child.parentId) return isDescendant(parentId, child.parentId);
      return false;
    };

    if (isDescendant(draggedNode.id, targetNode.id)) {
      console.error("Cannot move parent into its own descendant");
      return;
    }

    // Check max depth
    const targetDepth = targetNode.depth + 1;
    if (targetDepth >= maxDepth) {
      console.error(`Maximum depth of ${maxDepth} reached`);
      return;
    }

    // Move the dragged node to be a child of the target node
    await onTagMove(draggedNode.id, targetNode.id);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  // Expand all nodes
  const handleExpandAll = () => {
    setExpandedIds(new Set(tags.map((t) => t.id)));
  };

  // Collapse all nodes
  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Controls */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={handleExpandAll}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
        >
          Expand All
        </button>
        <button
          onClick={handleCollapseAll}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
        >
          Collapse All
        </button>
      </div>

      {/* Tree */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={flatNodes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-0.5">
            {flatNodes.map((node) => (
              <SortableTreeNode
                key={node.id}
                node={node}
                tagType={tagType}
                selectedTagId={selectedTagId}
                onTagSelect={onTagSelect}
                onToggleExpand={handleToggleExpand}
                isDragging={activeId === node.id}
                isDropTarget={overId === node.id && activeId !== node.id}
                maxDepth={maxDepth}
              />
            ))}
          </div>
        </SortableContext>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeNode ? <DragOverlayContent node={activeNode} tagType={tagType} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Root drop zone */}
      <button
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors mt-4"
        onClick={() => {
          // Handle dropping to root level
        }}
      >
        Drop here to move to root level
      </button>
    </div>
  );
}
