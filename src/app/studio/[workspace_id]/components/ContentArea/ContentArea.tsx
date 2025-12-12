"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { useTabStore } from "../../store/tabStore";

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
        <p className="text-[13px] text-gray-500">
          Select an entity from the explorer to open it here
        </p>
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
              ${
                tab.id === activeTabId
                  ? "bg-white text-[#383838]"
                  : "bg-transparent text-gray-500 hover:bg-[#E8E8E8]"
              }
            `}
          >
            {/* Active tab indicator */}
            {tab.id === activeTabId && (
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#007ACC]" />
            )}

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
        {activeTab && (
          <div>
            {/* Entity type badge */}
            <div className="mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-[#007ACC] h-5">
                {activeTab.type.toUpperCase()}
              </span>
            </div>

            {/* Entity title */}
            <h2 className="text-xl font-semibold text-[#383838] mb-1">
              {activeTab.label}
            </h2>

            {/* Entity ID */}
            <p className="text-xs text-gray-500 font-mono mb-3">
              Entity ID: {activeTab.entityId}
            </p>

            {/* Placeholder content */}
            <div className="mt-3 p-4 bg-[#F8F8F8] border border-[#E5E5E5] rounded">
              <p className="text-[13px] text-gray-500 mb-1">
                Read-only view coming soon...
              </p>
              <p className="text-xs text-gray-400">
                This is a placeholder for the {activeTab.type} entity viewer.
              </p>
            </div>
          </div>
        )}
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
