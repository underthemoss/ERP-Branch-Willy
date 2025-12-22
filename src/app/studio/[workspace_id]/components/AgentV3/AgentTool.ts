/**
 * AgentTool.ts - Server + local tools (fetches & runs)
 *
 * Handles:
 * - Fetching tool definitions from MCP server
 * - Registering local tools (studio-fs)
 * - Executing tools by name
 */

import * as studioFS from "@/lib/studio-fs";
import type { ToolDefinition } from "./AgentLLM";

// Re-export ToolDefinition from AgentLLM for convenience
export type { ToolDefinition } from "./AgentLLM";

// ============================================================================
// Types
// ============================================================================

export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

export interface AgentTool {
  getToolDefinitions(): Promise<ToolDefinition[]>;
  executeTool(name: string, args: Record<string, unknown>): Promise<unknown>;
}

// ============================================================================
// MCP Client (for server tools)
// ============================================================================

interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

interface McpRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface McpResponse<T = unknown> {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: { code: number; message: string };
}

class McpClient {
  private mcpUrl: string;
  private getAuthToken: () => Promise<string>;
  private requestId = 0;

  constructor(graphqlUrl: string, getAuthToken: () => Promise<string>) {
    const url = new URL(graphqlUrl);
    const pathPrefix = url.pathname.replace(/\/graphql$/, "");
    this.mcpUrl = `${url.protocol}//${url.host}${pathPrefix}/api/mcp`;
    this.getAuthToken = getAuthToken;
  }

  private parseSSEResponse<T>(text: string): McpResponse<T> {
    const lines = text.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        return JSON.parse(line.slice(6)) as McpResponse<T>;
      }
    }
    throw new Error("No data found in SSE response");
  }

  private async sendRequest<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    const token = await this.getAuthToken();
    this.requestId++;

    const request: McpRequest = { jsonrpc: "2.0", id: this.requestId, method, params };

    const response = await fetch(this.mcpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`MCP request failed: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    let data: McpResponse<T>;

    if (contentType.includes("text/event-stream")) {
      data = this.parseSSEResponse<T>(await response.text());
    } else {
      data = await response.json();
    }

    if (data.error) {
      throw new Error(`MCP error: ${data.error.message}`);
    }

    return data.result as T;
  }

  async initialize(): Promise<void> {
    await this.sendRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "es-erp-agent-v3", version: "3.0.0" },
    });
    try {
      await this.sendRequest("notifications/initialized", {});
    } catch {
      // Notifications may not return a response
    }
  }

  async listTools(): Promise<McpTool[]> {
    const result = await this.sendRequest<{ tools: McpTool[] }>("tools/list", {});
    return result.tools;
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    return this.sendRequest<ToolResult>("tools/call", { name, arguments: args });
  }
}

// ============================================================================
// Local Tools (studio-fs)
// ============================================================================

const LOCAL_TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the contents of a file from the workspace filesystem",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to the file (e.g., '/guides/intro.md')" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description:
        "Write content to a file. Creates parent directories if needed. Each write creates a commit (can be undone).",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to the file (e.g., '/guides/new-guide.md')" },
          content: { type: "string", description: "Content to write to the file" },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_directory",
      description: "List contents of a directory",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to the directory (e.g., '/' or '/guides')" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_file",
      description: "Delete a file or directory",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to delete" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "undo",
      description: "Undo the last file change (reverts to previous commit)",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "redo",
      description: "Redo a previously undone change",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_history",
      description: "Get the commit history of file changes",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Maximum number of commits to return (default: 10)",
          },
        },
        required: [],
      },
    },
  },
];

async function executeLocalTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  // Initialize filesystem
  await studioFS.initializeFS();

  switch (name) {
    case "read_file": {
      const path = args.path as string;
      const content = await studioFS.readFile(path);
      if (content === null) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: `File not found: ${path}` }) }],
          isError: true,
        };
      }
      return { content: [{ type: "text", text: JSON.stringify({ path, content }) }] };
    }

    case "write_file": {
      const path = args.path as string;
      const content = args.content as string;
      await studioFS.writeFile(path, content);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, path, message: "File saved and committed" }),
          },
        ],
      };
    }

    case "list_directory": {
      const path = args.path as string;
      const entries = await studioFS.readDir(path);
      return { content: [{ type: "text", text: JSON.stringify({ path, entries }) }] };
    }

    case "delete_file": {
      const path = args.path as string;
      try {
        await studioFS.remove(path);
        return { content: [{ type: "text", text: JSON.stringify({ success: true, path }) }] };
      } catch (err) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: `Failed to delete: ${path}` }) }],
          isError: true,
        };
      }
    }

    case "undo": {
      const success = await studioFS.undo();
      if (success) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, message: "Undone last change" }),
            },
          ],
        };
      }
      return {
        content: [
          { type: "text", text: JSON.stringify({ success: false, message: "Nothing to undo" }) },
        ],
        isError: true,
      };
    }

    case "redo": {
      const success = await studioFS.redo();
      if (success) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, message: "Redone last undone change" }),
            },
          ],
        };
      }
      return {
        content: [
          { type: "text", text: JSON.stringify({ success: false, message: "Nothing to redo" }) },
        ],
        isError: true,
      };
    }

    case "get_history": {
      const limit = (args.limit as number) || 10;
      const history = await studioFS.getHistory(limit);
      return { content: [{ type: "text", text: JSON.stringify({ history }) }] };
    }

    default:
      return {
        content: [{ type: "text", text: JSON.stringify({ error: `Unknown local tool: ${name}` }) }],
        isError: true,
      };
  }
}

// ============================================================================
// Combined Tool Runner
// ============================================================================

export interface CombinedToolConfig {
  graphqlUrl: string;
  getAuthToken: () => Promise<string>;
}

export class CombinedToolRunner implements AgentTool {
  private mcpClient: McpClient;
  private mcpTools: ToolDefinition[] = [];
  private initialized = false;

  constructor(config: CombinedToolConfig) {
    this.mcpClient = new McpClient(config.graphqlUrl, config.getAuthToken);
  }

  async getToolDefinitions(): Promise<ToolDefinition[]> {
    if (!this.initialized) {
      await this.mcpClient.initialize();
      const serverTools = await this.mcpClient.listTools();

      // Convert MCP tools to OpenAI format
      this.mcpTools = serverTools.map((tool) => ({
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: {
            type: "object" as const,
            properties: tool.inputSchema.properties || {},
            required: tool.inputSchema.required || [],
          },
        },
      }));

      this.initialized = true;
    }

    // Local tools take priority (filter out duplicates from MCP)
    const localNames = new Set(LOCAL_TOOLS.map((t) => t.function.name));
    const filteredMcp = this.mcpTools.filter((t) => !localNames.has(t.function.name));

    return [...LOCAL_TOOLS, ...filteredMcp];
  }

  async executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    // Check if it's a local tool
    const isLocal = LOCAL_TOOLS.some((t) => t.function.name === name);

    if (isLocal) {
      const result = await executeLocalTool(name, args);
      return this.parseToolResult(result);
    }

    // Execute via MCP
    const result = await this.mcpClient.callTool(name, args);
    return this.parseToolResult(result);
  }

  private parseToolResult(result: ToolResult): unknown {
    if (result.content.length === 0) return null;

    const textContent = result.content.find((c) => c.type === "text");
    if (!textContent) return null;

    try {
      return JSON.parse(textContent.text);
    } catch {
      return textContent.text;
    }
  }
}
