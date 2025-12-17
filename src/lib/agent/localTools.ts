"use client";

/**
 * Local Tools Module
 *
 * This module defines frontend-only tools that execute in the browser
 * without making a round-trip to the MCP server.
 *
 * Currently provides the `present_options` tool for user interaction.
 */
import { OpenAITool } from "./mcpClient";

// ============================================================================
// Types
// ============================================================================

/**
 * Local tool handler function signature
 */
export type LocalToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

/**
 * Local tool definition combining OpenAI format with handler
 */
export interface LocalTool {
  definition: OpenAITool;
  handler: LocalToolHandler;
}

/**
 * Result from executing a local tool
 */
export interface LocalToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

/**
 * Option for the present_options tool
 */
export interface UserOption {
  id: string;
  label: string;
}

/**
 * Arguments for the present_options tool
 */
export interface PresentOptionsArgs {
  question: string;
  options: UserOption[];
}

/**
 * Special result type indicating the tool needs user input
 */
export interface PendingUserOptionsResult {
  __type: "pending_user_options";
  question: string;
  options: UserOption[];
}

// ============================================================================
// Local Tools Registry
// ============================================================================

/**
 * Registry of local tools (frontend-only, no server round-trip)
 */
export const localTools: Map<string, LocalTool> = new Map();

// ============================================================================
// Present Options Tool
// ============================================================================

/**
 * Tool that presents the user with options and waits for their selection.
 * This enables interactive decision-making during agent conversations.
 */
localTools.set("present_options", {
  definition: {
    type: "function",
    function: {
      name: "present_options",
      description: `Present the user with a set of options and wait for their selection. 
Use this tool when you need user input to decide how to proceed. 
The user will see clickable buttons for each option.

Common use cases:
- Asking the user to choose between multiple matching items
- Confirming before making changes
- Offering next steps after completing an action
- Clarifying ambiguous requests`,
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "The question or prompt to display to the user",
          },
          options: {
            type: "array",
            description: "Array of options for the user to choose from (2-6 options recommended)",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description:
                    "Unique identifier for this option (e.g., 'create_new', 'update_existing')",
                },
                label: {
                  type: "string",
                  description: "Human-readable label shown to the user",
                },
              },
              required: ["id", "label"],
            },
          },
        },
        required: ["question", "options"],
      },
    },
  },
  handler: async (args): Promise<PendingUserOptionsResult> => {
    const question = args.question as string;
    const options = args.options as UserOption[];

    // Return a special result that signals the UI to show options
    // The useAgentChat hook will intercept this and pause for user selection
    return {
      __type: "pending_user_options",
      question,
      options,
    };
  },
});

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all local tool definitions in OpenAI format
 */
export function getLocalToolDefinitions(): OpenAITool[] {
  return Array.from(localTools.values()).map((t) => t.definition);
}

/**
 * Check if a tool is a local tool
 */
export function isLocalTool(name: string): boolean {
  return localTools.has(name);
}

/**
 * Check if a tool is the present_options tool
 */
export function isPresentOptionsTool(name: string): boolean {
  return name === "present_options";
}

/**
 * Check if a result is a pending user options result
 */
export function isPendingUserOptionsResult(result: unknown): result is PendingUserOptionsResult {
  if (typeof result !== "object" || result === null) {
    return false;
  }
  const obj = result as Record<string, unknown>;
  return (
    obj.__type === "pending_user_options" &&
    typeof obj.question === "string" &&
    Array.isArray(obj.options)
  );
}

/**
 * Execute a local tool and return result in MCP-compatible format
 */
export async function executeLocalTool(
  name: string,
  args: Record<string, unknown>,
): Promise<LocalToolResult> {
  const tool = localTools.get(name);
  if (!tool) {
    return {
      content: [{ type: "text", text: JSON.stringify({ error: `Local tool not found: ${name}` }) }],
      isError: true,
    };
  }

  try {
    const result = await tool.handler(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: JSON.stringify({ error: errorMessage }) }],
      isError: true,
    };
  }
}

/**
 * Register a custom local tool at runtime
 */
export function registerLocalTool(name: string, tool: LocalTool): void {
  if (localTools.has(name)) {
    console.warn(`⚠️ Overwriting existing local tool: ${name}`);
  }
  localTools.set(name, tool);
  console.log(`🔧 Registered local tool: ${name}`);
}

/**
 * Unregister a local tool
 */
export function unregisterLocalTool(name: string): boolean {
  return localTools.delete(name);
}
