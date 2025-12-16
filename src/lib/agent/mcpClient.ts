"use client";

/**
 * MCP (Model Context Protocol) Client for the frontend agent
 *
 * This module provides utilities to:
 * 1. Fetch available tools from the MCP server
 * 2. Execute tools via MCP server
 * 3. Convert MCP tool definitions to OpenAI format
 */

// ============================================================================
// Types
// ============================================================================

/**
 * MCP Tool definition as returned by the server
 */
export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties?: Record<
      string,
      {
        type: string;
        description?: string;
        enum?: string[];
        items?: Record<string, unknown>;
      }
    >;
    required?: string[];
  };
}

/**
 * OpenAI tool format (used for chat completions)
 */
export interface OpenAITool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
    };
  };
}

/**
 * MCP JSON-RPC request format
 */
interface McpRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

/**
 * MCP JSON-RPC response format
 */
interface McpResponse<T = unknown> {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

/**
 * MCP tools/list response
 */
interface McpToolsListResult {
  tools: McpTool[];
}

/**
 * MCP tools/call response
 */
interface McpToolCallResult {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
}

// ============================================================================
// MCP Client Class
// ============================================================================

/**
 * MCP Client for communicating with the backend MCP server
 */
export class McpClient {
  private mcpUrl: string;
  private getAuthToken: () => Promise<string>;
  private requestId = 0;

  constructor(graphqlUrl: string, getAuthToken: () => Promise<string>) {
    // Derive MCP URL from GraphQL URL
    const url = new URL(graphqlUrl);
    const pathPrefix = url.pathname.replace(/\/graphql$/, "");
    this.mcpUrl = `${url.protocol}//${url.host}${pathPrefix}/api/mcp`;
    this.getAuthToken = getAuthToken;
  }

  /**
   * Parse SSE (Server-Sent Events) response format
   * The MCP server returns responses in SSE format: "event: message\ndata: {...}\n\n"
   */
  private parseSSEResponse<T>(text: string): McpResponse<T> {
    const lines = text.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const jsonStr = line.slice(6); // Remove "data: " prefix
        return JSON.parse(jsonStr) as McpResponse<T>;
      }
    }
    throw new Error("No data found in SSE response");
  }

  /**
   * Send a JSON-RPC request to the MCP server
   */
  private async sendRequest<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    const token = await this.getAuthToken();
    this.requestId++;

    const request: McpRequest = {
      jsonrpc: "2.0",
      id: this.requestId,
      method,
      params,
    };

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
      const errorText = await response.text();
      throw new Error(`MCP request failed: ${response.status} - ${errorText}`);
    }

    // The MCP server returns SSE format (text/event-stream)
    // We need to parse it to extract the JSON response
    const contentType = response.headers.get("content-type") || "";
    let data: McpResponse<T>;

    if (contentType.includes("text/event-stream")) {
      const text = await response.text();
      data = this.parseSSEResponse<T>(text);
    } else {
      // Fallback to JSON if server returns application/json
      data = await response.json();
    }

    if (data.error) {
      throw new Error(`MCP error: ${data.error.message}`);
    }

    return data.result as T;
  }

  /**
   * Initialize the MCP connection
   */
  async initialize(): Promise<void> {
    await this.sendRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "es-erp-frontend",
        version: "1.0.0",
      },
    });

    // Send initialized notification (no response expected, but we'll handle it)
    try {
      await this.sendRequest("notifications/initialized", {});
    } catch {
      // Notifications may not return a response, that's okay
    }
  }

  /**
   * Get list of available tools from the MCP server
   */
  async listTools(): Promise<McpTool[]> {
    const result = await this.sendRequest<McpToolsListResult>("tools/list", {});
    return result.tools;
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<McpToolCallResult> {
    const result = await this.sendRequest<McpToolCallResult>("tools/call", {
      name,
      arguments: args,
    });
    return result;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert MCP tools to OpenAI tool format
 */
export function mcpToolsToOpenAI(mcpTools: McpTool[]): OpenAITool[] {
  return mcpTools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object",
        properties: tool.inputSchema.properties || {},
        required: tool.inputSchema.required || [],
      },
    },
  }));
}

/**
 * Parse the text content from an MCP tool call result
 */
export function parseToolResult(result: McpToolCallResult): unknown {
  if (result.content.length === 0) {
    return null;
  }

  const textContent = result.content.find((c) => c.type === "text");
  if (!textContent) {
    return null;
  }

  try {
    return JSON.parse(textContent.text);
  } catch {
    return textContent.text;
  }
}
