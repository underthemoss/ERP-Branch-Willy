"use client";

import { graphql } from "@/graphql";
import { useProjectSelectorListSelectorQuery } from "@/graphql/hooks";
import { useSelectedWorkspaceId } from "@/providers/WorkspaceProvider";
import { ChevronDown, ChevronRight, Folder, FolderOpen, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export const CONTACT_SELECTOR_LIST = graphql(`
  query ProjectSelectorListSelector($workspaceId: String!) {
    listProjects(workspaceId: $workspaceId) {
      parent_project
      id
      name
      project_code
      deleted
    }
  }
`);

type ProjectTreeItem = {
  id: string;
  label: string;
  children: ProjectTreeItem[];
  searchterms: string;
  fullLineageLabel: string;
};

export interface ProjectSelectorProps {
  projectId?: string;
  onChange: (contactId: string) => void;
}

interface TreeNodeProps {
  node: ProjectTreeItem;
  onSelect: (id: string) => void;
  selectedId?: string;
  level: number;
  expandedNodes: Set<string>;
  toggleExpand: (id: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  onSelect,
  selectedId,
  level,
  expandedNodes,
  toggleExpand,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedId === node.id;

  return (
    <div>
      <button
        type="button"
        onClick={(e) => {
          // If clicking on the expand icon area, toggle expand
          if (hasChildren && e.currentTarget === e.target) {
            toggleExpand(node.id);
          } else {
            onSelect(node.id);
          }
        }}
        className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
          isSelected ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-50 text-gray-700"
        }`}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(node.id);
            }}
            className="flex-shrink-0 p-0.5 hover:bg-gray-200 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}
        {isExpanded ? (
          <FolderOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
        ) : (
          <Folder className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
        <span className="flex-1 text-left truncate">{node.label}</span>
      </button>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onSelect={onSelect}
              selectedId={selectedId}
              level={level + 1}
              expandedNodes={expandedNodes}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ projectId, onChange }) => {
  const [search, setSearch] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const workspaceId = useSelectedWorkspaceId();

  const { data, loading, error } = useProjectSelectorListSelectorQuery({
    variables: { workspaceId: workspaceId || "" },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  const projects = (data?.listProjects || [])
    .filter((i) => i !== null)
    .filter((d) => d.deleted === false);

  const prepareTree = useCallback(() => {
    const searchLower = search.toLowerCase();
    const rootProjects = projects.filter((d) => !d?.parent_project);

    const findChildren = (
      item: { id: string; label: string },
      lineageSoFar: string,
    ): ProjectTreeItem | null => {
      const fullLineage = lineageSoFar ? `${lineageSoFar} > ${item.label}` : item.label;
      const children = projects
        .filter((p) => p.parent_project === item.id)
        .map((i) => findChildren({ id: i.id, label: i.name }, fullLineage))
        .filter((c): c is ProjectTreeItem => c !== null);

      // Check if this node matches the search
      const matchesSelf = item.label.toLowerCase().includes(searchLower);

      // Check if any children match (already filtered recursively)
      if (matchesSelf || children.length > 0 || searchLower === "") {
        return {
          id: item.id,
          label: item.label,
          searchterms: item.label,
          fullLineageLabel: fullLineage,
          children,
        };
      }
      // If neither this node nor any children match, exclude this node
      return null;
    };

    const items = rootProjects
      .map((i) => findChildren({ id: i.id, label: i.name }, ""))
      .filter((i): i is ProjectTreeItem => i !== null);

    return items;
  }, [projects, search]);

  const items = prepareTree();

  // Flatten the tree into a hashmap for quick lookup by id
  const projectMap = useMemo(() => {
    const map: Record<string, ProjectTreeItem> = {};
    const traverse = (nodes: ProjectTreeItem[]) => {
      for (const node of nodes) {
        map[node.id] = node;
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      }
    };
    traverse(items);
    return map;
  }, [items]);

  // Auto-expand nodes when searching
  useEffect(() => {
    if (search) {
      const newExpanded = new Set<string>();
      const expandMatches = (nodes: ProjectTreeItem[]) => {
        nodes.forEach((node) => {
          if (node.children && node.children.length > 0) {
            newExpanded.add(node.id);
            expandMatches(node.children);
          }
        });
      };
      expandMatches(items);
      setExpandedNodes(newExpanded);
    }
  }, [search, items]);

  // Calculate dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
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

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleSelect = (id: string) => {
    onChange(id);
    setPopoverOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const selectedProject = projectId ? projectMap[projectId] : null;

  // Get the lineage/ancestry of the selected project
  const getProjectLineage = useCallback(
    (targetProjectId: string): { id: string; name: string }[] => {
      const lineage: { id: string; name: string }[] = [];
      const findPath = (id: string): boolean => {
        const project = projects.find((p) => p.id === id);
        if (!project) return false;

        lineage.unshift({ id: project.id, name: project.name });

        if (project.parent_project) {
          return findPath(project.parent_project);
        }
        return true;
      };

      findPath(targetProjectId);
      return lineage;
    },
    [projects],
  );

  const selectedLineage = projectId ? getProjectLineage(projectId) : [];

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
          placeholder="Search projects..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          autoComplete="off"
        />
      </div>

      {/* Tree View */}
      <div className="overflow-y-auto max-h-96">
        {loading ? (
          <div className="px-3 py-8 text-sm text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <p className="mt-2">Loading projects...</p>
          </div>
        ) : error ? (
          <div className="px-3 py-8 text-sm text-center text-red-500">Error loading projects</div>
        ) : items.length === 0 ? (
          <div className="px-3 py-8 text-sm text-center text-gray-500">
            {search ? "No projects match your search" : "No projects available"}
          </div>
        ) : (
          <div className="py-1">
            {items.map((item) => (
              <TreeNode
                key={item.id}
                node={item}
                onSelect={handleSelect}
                selectedId={projectId}
                level={0}
                expandedNodes={expandedNodes}
                toggleExpand={toggleExpand}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div ref={containerRef} className="relative">
        {projectId && selectedLineage.length > 0 ? (
          // Selected state - show as tree hierarchy
          <div className="bg-blue-50 border border-gray-300 rounded-lg overflow-hidden">
            <div className="relative">
              {selectedLineage.map((project, index) => {
                const isLast = index === selectedLineage.length - 1;
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setPopoverOpen(true)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                      isLast
                        ? "bg-blue-50 text-blue-700 font-medium hover:bg-blue-100"
                        : "bg-blue-50/50 text-blue-600 hover:bg-blue-100/50"
                    }`}
                    style={{ paddingLeft: `${index * 20 + 12}px` }}
                  >
                    <div className="w-5 flex-shrink-0" />
                    <Folder
                      className={`w-4 h-4 flex-shrink-0 ${isLast ? "text-blue-500" : "text-blue-400"}`}
                    />
                    <span className="flex-1 text-left truncate">{project.name}</span>
                    {isLast && (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="flex-shrink-0 p-0.5 hover:bg-blue-200 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-blue-600" />
                      </button>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          // Input state - show search field
          <button
            type="button"
            onClick={() => setPopoverOpen(true)}
            className="w-full px-3 py-2 text-sm text-left bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-colors flex items-center justify-between gap-2"
          >
            <span className="text-gray-500 flex-1">Search projects...</span>
            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
        )}
      </div>

      {/* Render dropdown via portal to avoid layout issues */}
      {typeof document !== "undefined" && dropdown && createPortal(dropdown, document.body)}
    </>
  );
};

export default ProjectSelector;
