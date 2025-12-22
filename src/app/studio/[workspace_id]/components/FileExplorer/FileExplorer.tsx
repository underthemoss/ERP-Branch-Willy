"use client";

import * as studioFS from "@/lib/studio-fs";
import type { FileEntry } from "@/lib/studio-fs";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FileCode,
  FileSpreadsheet,
  FileText,
  Folder,
  Loader2,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Tree } from "react-arborist";
import { useConversationStore } from "../../store/conversationStore";
import { useTabStore } from "../../store/tabStore";

interface FileExplorerProps {
  workspaceId: string; // Reserved for future workspace-scoped storage
}

interface TreeNode {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  isHidden: boolean;
  children?: TreeNode[];
}

// Default content for getting-started.md
const GETTING_STARTED_CONTENT = `# Welcome to Studio! 🎉

This is your workspace file explorer. You can:

- **Create files** - Store notes, chats, and drafts
- **Organize with folders** - Keep things tidy
- **Chat with AI** - Use the agent panel on the right

## Getting Started

1. Open the Agent Panel (right side)
2. Ask the AI to help you with tasks
3. Your chat sessions can be saved here

## File Types

- \`.md\` - Markdown notes
- \`.chat\` - AI chat sessions  
- \`.json\` - Data files
- \`.csv\` - Spreadsheet data

Happy exploring! 🚀
`;

// Default content for guides/agent-guide.md
const AGENT_GUIDE_CONTENT = `# AI Agent Guide 🤖

The AI Agent is your intelligent assistant for managing your ERP workspace.

## What Can the Agent Do?

### 📦 Projects
- Create and manage projects
- Search for existing projects
- Update project details

### 👥 Contacts
- Add business and person contacts
- Search your contact database
- Link contacts to projects

### 💰 Sales & Quotes
- Generate quotes for customers
- Create sales orders
- Manage purchase orders

### 📊 Inventory
- Track inventory levels
- View item details
- Manage stock

### 💵 Pricing
- Manage price books
- Set rental and sale prices

## How to Use

1. **Open the Agent Panel** on the right side of Studio
2. **Type your request** in natural language
3. **Review the response** - the agent may ask clarifying questions
4. **Confirm actions** - some operations need your approval

## Example Prompts

- "Create a new project called Summer Event 2024"
- "Find all contacts from Acme Corp"
- "What's the rental price for a generator?"
- "Create a quote for 5 tables and 20 chairs"

## Tips

- Be specific about what you want
- Include relevant details (names, dates, quantities)
- The agent remembers context within a conversation
- Start a new chat for unrelated tasks
`;

/**
 * Convert FileEntry to TreeNode format for react-arborist
 */
function fileEntryToTreeNode(entry: FileEntry): TreeNode {
  return {
    id: entry.path,
    name: entry.name,
    path: entry.path,
    isDirectory: entry.isDirectory,
    isHidden: entry.name.startsWith("."),
    children: entry.isDirectory ? [] : undefined,
  };
}

/**
 * Recursively load directory structure
 */
async function loadDirectoryTree(path: string, showHidden: boolean): Promise<TreeNode[]> {
  const entries = await studioFS.readDir(path);
  const nodes: TreeNode[] = [];

  for (const entry of entries) {
    // Skip hidden files if not showing them
    if (!showHidden && entry.name.startsWith(".")) continue;

    const node = fileEntryToTreeNode(entry);

    if (entry.isDirectory) {
      // Recursively load children
      node.children = await loadDirectoryTree(entry.path, showHidden);
    }

    nodes.push(node);
  }

  return nodes;
}

export function FileExplorer({ workspaceId: _workspaceId }: FileExplorerProps) {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const openTab = useTabStore((state) => state.openTab);
  const requestLoadConversation = useConversationStore((state) => state.requestLoadConversation);

  // Initialize FS and build tree
  useEffect(() => {
    let cancelled = false;

    async function initAndLoad() {
      try {
        // Initialize the git-backed filesystem
        await studioFS.initializeFS();

        // Check if FS has any files
        const rootEntries = await studioFS.readDir("/");
        const hasUserFiles = rootEntries.some((e) => !e.name.startsWith("."));

        if (!hasUserFiles) {
          // First time - create default files
          await studioFS.writeFile("/getting-started.md", GETTING_STARTED_CONTENT);

          // Create guides folder with agent guide
          await studioFS.mkdir("/guides");
          await studioFS.writeFile("/guides/agent-guide.md", AGENT_GUIDE_CONTENT);
        }

        // Build tree
        if (!cancelled) {
          const tree = await loadDirectoryTree("/", showHidden);
          setTreeData(tree);
        }
      } catch (err) {
        console.error("Failed to initialize filesystem:", err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    initAndLoad();

    // Subscribe to filesystem changes to rebuild tree
    const unsubscribe = studioFS.subscribe(async () => {
      if (!cancelled) {
        try {
          const tree = await loadDirectoryTree("/", showHidden);
          if (!cancelled) {
            setTreeData(tree);
          }
        } catch (err) {
          console.error("Failed to rebuild tree:", err);
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [showHidden]);

  // Measure container dimensions
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setDimensions({ width: rect.width, height: rect.height });
        }
      }
    };

    updateDimensions();
    const timeoutId = setTimeout(updateDimensions, 100);

    const resizeObserver = new ResizeObserver((observerEntries) => {
      for (const entry of observerEntries) {
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
  }, [treeData.length]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    try {
      // Force notify subscribers (triggers re-read)
      studioFS.notify();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [isRefreshing]);

  const handleNodeClick = useCallback(
    (node: { data: TreeNode }) => {
      const data = node.data;
      if (!data.isDirectory) {
        // Determine action from file extension
        const ext = data.name.split(".").pop()?.toLowerCase();

        // .chat files load into the Agent panel
        if (ext === "chat") {
          requestLoadConversation(data.path);
          return;
        }

        // Other files open in tabs
        let tabType: "file" | "markdown" | "csv" = "file";

        if (ext === "md") {
          tabType = "markdown";
        } else if (ext === "csv") {
          tabType = "csv";
        }

        openTab(tabType, data.path, data.name);
      }
    },
    [openTab, requestLoadConversation],
  );

  const getIcon = (node: TreeNode) => {
    const iconClass = "w-4 h-4 flex-shrink-0";

    if (node.isDirectory) {
      return <Folder className={`${iconClass} text-[#C09553]`} />;
    }

    const ext = node.name.split(".").pop()?.toLowerCase();

    if (ext === "chat") {
      return <MessageSquare className={`${iconClass} text-[#007ACC]`} />;
    }
    if (ext === "md") {
      return <FileText className={`${iconClass} text-[#519ABA]`} />;
    }
    if (ext === "json") {
      return <FileCode className={`${iconClass} text-[#CBCB41]`} />;
    }
    if (ext === "csv") {
      return <FileSpreadsheet className={`${iconClass} text-[#41A35D]`} />;
    }

    return <FileText className={`${iconClass} text-gray-500`} />;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Node = ({ node, style, dragHandle }: any) => {
    const data = node.data as TreeNode;
    const icon = getIcon(data);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div
        ref={dragHandle}
        style={style}
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest(".toggle-arrow")) {
            handleNodeClick({ data });
          }
        }}
      >
        <div
          className={`flex items-center gap-1 pr-2 h-[22px] cursor-pointer transition-colors text-[13px] hover:bg-[#E8E8E8] ${data.isHidden ? "text-gray-400 italic" : "text-[#383838]"}`}
        >
          <div
            className="toggle-arrow flex items-center justify-center w-4 h-4 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren || data.isDirectory) {
                node.toggle();
              }
            }}
          >
            {hasChildren || data.isDirectory ? (
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

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#F3F3F3]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#F3F3F3]">
      {/* Header */}
      <div className="p-2 px-3 bg-white border-b border-[#E5E5E5] flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHidden(!showHidden)}
            className={`p-1 hover:bg-[#E8E8E8] rounded transition-colors ${showHidden ? "bg-[#E8E8E8]" : ""}`}
            title={showHidden ? "Hide hidden files" : "Show hidden files"}
          >
            {showHidden ? (
              <Eye className="w-3.5 h-3.5 text-[#007ACC]" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-gray-500" />
            )}
          </button>
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
      </div>

      {/* Tree Area */}
      <div ref={containerRef} className="flex-1 min-h-0 relative">
        {dimensions.height > 0 && treeData.length > 0 ? (
          <Tree
            data={treeData}
            openByDefault={false}
            width={dimensions.width}
            height={dimensions.height}
            indent={16}
            rowHeight={22}
          >
            {Node}
          </Tree>
        ) : treeData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[13px] text-gray-500">No files yet</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[13px] text-gray-500">Measuring container...</p>
          </div>
        )}
      </div>
    </div>
  );
}
