"use client";

import {
  Building2,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Loader2,
  RefreshCw,
  User,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Tree } from "react-arborist";
import { useTabStore } from "../../store/tabStore";
import { FileNode } from "./types";
import { VirtualFileSystem } from "./VirtualFileSystem";

interface FileExplorerProps {
  workspaceId: string;
}

export function FileExplorer({ workspaceId }: FileExplorerProps) {
  const [treeData, setTreeData] = useState<FileNode[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const refreshFnRef = useRef<(() => void) | null>(null);
  const openTab = useTabStore((state) => state.openTab);

  const handleRefreshReady = useCallback((refetchFn: () => void) => {
    refreshFnRef.current = refetchFn;
  }, []);

  const handleRefresh = useCallback(() => {
    if (refreshFnRef.current && !isRefreshing) {
      setIsRefreshing(true);
      refreshFnRef.current();
      // Reset after a short delay
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  }, [isRefreshing]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initial manual measurement
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setDimensions({ width: rect.width, height: rect.height });
        }
      }
    };

    // Try immediate measurement
    updateDimensions();

    // Also try after a brief delay in case layout hasn't completed
    const timeoutId = setTimeout(updateDimensions, 100);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [treeData.length]); // Re-run when treeData changes from empty to populated

  const handleNodeClick = (node: any) => {
    const data = node.data as FileNode;
    if (data && data.type === "entity" && data.entityType && data.entityId) {
      openTab(data.entityType, data.entityId, data.name);
    }
  };

  const Node = ({ node, style, dragHandle }: any) => {
    const data = node.data as FileNode;
    const icon = getIcon(data);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div
        ref={dragHandle}
        style={style}
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest(".toggle-arrow")) {
            handleNodeClick(node);
          }
        }}
      >
        <div className="flex items-center gap-1 pr-2 h-[22px] cursor-pointer transition-colors text-[13px] text-[#383838] hover:bg-[#E8E8E8]">
          <div
            className="toggle-arrow flex items-center justify-center w-4 h-4 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) {
                node.toggle();
              }
            }}
          >
            {hasChildren ? (
              node.isOpen ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )
            ) : (
              <span className="w-4" />
            )}
          </div>
          {icon}
          <span className="overflow-hidden text-ellipsis whitespace-nowrap flex-1 min-w-0">
            {data.name}
          </span>
        </div>
      </div>
    );
  };

  const getIcon = (node: FileNode) => {
    const iconClass = "w-4 h-4 flex-shrink-0";

    if (node.type === "folder") return <Folder className={iconClass} />;
    if (node.entityType === "pricebook") return <FileText className={iconClass} />;
    if (node.entityType === "project") return <Folder className={iconClass} />;
    if (node.entityType === "contact") {
      return node.children ? <Building2 className={iconClass} /> : <User className={iconClass} />;
    }
    return <FileText className={iconClass} />;
  };

  if (treeData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <VirtualFileSystem
          workspaceId={workspaceId}
          onTreeDataReady={setTreeData}
          onRefreshReady={handleRefreshReady}
        />
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#F3F3F3]">
      <VirtualFileSystem
        workspaceId={workspaceId}
        onTreeDataReady={setTreeData}
        onRefreshReady={handleRefreshReady}
      />

      {/* Header */}
      <div className="p-2 px-3 bg-white border-b border-[#E5E5E5] flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
          Explorer
        </span>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1 hover:bg-[#E8E8E8] rounded transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-gray-500 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Tree Area */}
      <div ref={containerRef} className="flex-1 min-h-0 relative">
        {dimensions.height > 0 ? (
          <Tree
            data={treeData}
            openByDefault={false}
            width={dimensions.width}
            height={dimensions.height}
            indent={16}
            rowHeight={22}
            onClick={handleNodeClick}
          >
            {Node}
          </Tree>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[13px] text-gray-500">Measuring container...</p>
          </div>
        )}
      </div>
    </div>
  );
}
