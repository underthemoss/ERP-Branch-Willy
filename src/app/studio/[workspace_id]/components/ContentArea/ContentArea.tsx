"use client";

import * as studioFS from "@/lib/studio-fs";
import { FileCode, FileSpreadsheet, FileText, MessageSquare, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTabStore } from "../../store/tabStore";
import { ChatViewer, CSVViewer, JSONViewer, MarkdownViewer, TextViewer } from "./renderers";

/**
 * Determine file type from path extension
 */
function getFileTypeFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "md":
    case "markdown":
      return "markdown";
    case "csv":
      return "csv";
    case "json":
      return "json";
    case "chat":
      return "chat";
    default:
      return "text";
  }
}

/**
 * File content viewer - handles different file types
 */
function FileViewer({ path, type: propType }: { path: string; type: string }) {
  // Prefer detected type from path extension
  const type = getFileTypeFromPath(path) || propType;
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFile() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await studioFS.readFile(path);
        if (!cancelled) {
          setContent(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load file");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadFile();

    return () => {
      cancelled = true;
    };
  }, [path]);

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">Error: {error}</div>;
  }

  if (content === null) {
    return <div className="text-sm text-gray-500">File not found</div>;
  }

  // Render based on file type
  switch (type) {
    case "markdown":
      return <MarkdownViewer content={content} />;
    case "csv":
      return <CSVViewer content={content} />;
    case "json":
      return <JSONViewer content={content} />;
    case "chat":
      return <ChatViewer content={content} />;
    default:
      return <TextViewer content={content} />;
  }
}

/**
 * Get icon for tab type
 */
function getTabIcon(type: string, path?: string) {
  const iconClass = "w-4 h-4 flex-shrink-0";

  // Check extension for CSV
  const ext = path?.split(".").pop()?.toLowerCase();
  if (ext === "csv") {
    return <FileSpreadsheet className={`${iconClass} text-[#41A35D]`} />;
  }

  switch (type) {
    case "markdown":
      return <FileText className={`${iconClass} text-[#519ABA]`} />;
    case "csv":
      return <FileSpreadsheet className={`${iconClass} text-[#41A35D]`} />;
    case "chat":
      return <MessageSquare className={`${iconClass} text-[#007ACC]`} />;
    default:
      return <FileCode className={`${iconClass} text-gray-500`} />;
  }
}

export function ContentArea() {
  const {
    tabs,
    activeTabId,
    setActiveTab,
    closeTab,
    closeOtherTabs,
    closeTabsToRight,
    closeAllTabs,
  } = useTabStore();
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    tabId: string;
  } | null>(null);

  const handleContextMenu = (event: React.MouseEvent, tabId: string) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      tabId,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return;

    switch (action) {
      case "close":
        closeTab(contextMenu.tabId);
        break;
      case "closeOthers":
        closeOtherTabs(contextMenu.tabId);
        break;
      case "closeToRight":
        closeTabsToRight(contextMenu.tabId);
        break;
      case "closeAll":
        closeAllTabs();
        break;
    }

    handleCloseContextMenu();
  };

  if (tabs.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[13px] text-gray-500">
            Select a file from the explorer to open it here
          </p>
        </div>
      </div>
    );
  }

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  return (
    <div className="h-full flex flex-col">
      {/* Tab Bar */}
      <div className="flex bg-[#F3F3F3] border-b border-[#E5E5E5] overflow-x-auto overflow-y-hidden">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            onContextMenu={(e) => handleContextMenu(e, tab.id)}
            className={`
              relative flex items-center gap-2 px-3 h-[35px] cursor-pointer 
              border-r border-[#E5E5E5] min-w-[120px] max-w-[200px] flex-shrink-0
              transition-colors duration-150 text-[13px] select-none
              ${tab.id === activeTabId ? "bg-white text-[#383838]" : "bg-transparent text-gray-500 hover:bg-[#E8E8E8]"}
            `}
          >
            {/* Active tab indicator */}
            {tab.id === activeTabId && (
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#007ACC]" />
            )}

            {/* Tab icon */}
            {getTabIcon(tab.type, tab.entityId)}

            {/* Tab label */}
            <div className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
              {tab.label}
            </div>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded hover:bg-black/10 text-gray-500 hover:text-[#383838] transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-4 px-5 bg-white">
        {activeTab && <FileViewer path={activeTab.entityId} type={activeTab.type} />}
      </div>

      {/* Custom Context Menu */}
      {contextMenu && (
        <>
          {/* Invisible backdrop */}
          <div
            className="fixed inset-0 z-[1299]"
            onClick={handleCloseContextMenu}
            onContextMenu={(e) => e.preventDefault()}
          />

          {/* Context Menu */}
          <div
            className="fixed z-[1300] bg-white border border-gray-300 rounded-[3px] shadow-md min-w-[180px] py-0.5"
            style={{
              top: contextMenu.mouseY,
              left: contextMenu.mouseX,
            }}
          >
            <button
              className="w-full text-left text-xs text-[#383838] px-4 py-1 cursor-pointer select-none leading-5 hover:bg-[#E8E8E8] transition-colors"
              onClick={() => handleContextMenuAction("close")}
            >
              Close Tab
            </button>
            <button
              className="w-full text-left text-xs text-[#383838] px-4 py-1 cursor-pointer select-none leading-5 hover:bg-[#E8E8E8] transition-colors"
              onClick={() => handleContextMenuAction("closeOthers")}
            >
              Close Other Tabs
            </button>
            <button
              className="w-full text-left text-xs text-[#383838] px-4 py-1 cursor-pointer select-none leading-5 hover:bg-[#E8E8E8] transition-colors"
              onClick={() => handleContextMenuAction("closeToRight")}
            >
              Close Tabs to the Right
            </button>
            <button
              className="w-full text-left text-xs text-[#383838] px-4 py-1 cursor-pointer select-none leading-5 hover:bg-[#E8E8E8] transition-colors"
              onClick={() => handleContextMenuAction("closeAll")}
            >
              Close All Tabs
            </button>
          </div>
        </>
      )}
    </div>
  );
}
