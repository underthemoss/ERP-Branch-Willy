"use client";

import { useConfig } from "@/providers/ConfigProvider";
import { useAuth0 } from "@auth0/auth0-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { McpClient, mcpToolsToOpenAI, OpenAITool, parseToolResult } from "./mcpClient";

export interface ToolCallInfo {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  error?: string;
  timestamp: number;
}

export interface ChatMessage {
  role: "user" | "assistant" | "tool" | "tool_display";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
  toolCallInfos?: ToolCallInfo[];
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface UseAgentChatOptions {
  workspaceId: string;
  model?: string;
  stream?: boolean;
  requireToolApproval?: boolean;
}

export interface PendingToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  rawArguments: string;
}

export interface FileContext {
  fileName: string;
  formattedContent: string;
}

export interface UseAgentChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string, fileContext?: FileContext) => Promise<void>;
  clearMessages: () => void;
  toolCallHistory: ToolCallInfo[];
  availableTools: OpenAITool[];
  isInitialized: boolean;
  // Tool approval
  pendingToolCalls: PendingToolCall[];
  isAwaitingApproval: boolean;
  approveToolCalls: (toolsToAlwaysAllow?: string[]) => void;
  rejectToolCalls: () => void;
  // Allowed tools (pre-approved for future use)
  allowedTools: Set<string>;
}

/**
 * Derives the agent API URL from the GraphQL URL
 * Replaces /graphql with /api/agent/chat
 */
function getAgentApiUrl(graphqlUrl: string): string {
  const url = new URL(graphqlUrl);
  const pathPrefix = url.pathname.replace(/\/graphql$/, "");
  return `${url.protocol}//${url.host}${pathPrefix}/api/agent/chat`;
}

/**
 * Parse SSE stream data
 */
interface StreamDelta {
  content?: string;
  toolCallDeltas?: Array<{
    index: number;
    id?: string;
    type?: string;
    function?: {
      name?: string;
      arguments?: string;
    };
  }>;
  finishReason?: string;
}

function parseSSEData(data: string): StreamDelta {
  if (data === "[DONE]") {
    return { finishReason: "stop" };
  }

  try {
    const parsed = JSON.parse(data);
    const delta = parsed.choices?.[0]?.delta;
    const finishReason = parsed.choices?.[0]?.finish_reason;

    return {
      content: delta?.content,
      toolCallDeltas: delta?.tool_calls,
      finishReason,
    };
  } catch {
    return {};
  }
}

/**
 * Accumulate streaming tool call deltas into complete tool calls
 */
function accumulateToolCall(
  existing: Map<number, Partial<ToolCall>>,
  delta: StreamDelta["toolCallDeltas"],
): void {
  if (!delta) return;

  for (const d of delta) {
    const idx = d.index;
    const current = existing.get(idx) || {
      id: "",
      type: "function" as const,
      function: { name: "", arguments: "" },
    };

    if (d.id) current.id = d.id;
    if (d.type) current.type = d.type as "function";
    if (d.function?.name) current.function!.name = d.function.name;
    if (d.function?.arguments) {
      current.function!.arguments = (current.function!.arguments || "") + d.function.arguments;
    }

    existing.set(idx, current);
  }
}

/**
 * Custom hook for agent chat with MCP tool execution and streaming support
 *
 * This manages the conversation loop:
 * 1. Initialize MCP client and fetch available tools
 * 2. Send user message to backend API (which proxies to OpenAI)
 * 3. If streaming, display tokens as they arrive
 * 4. If OpenAI requests a tool call, execute it via MCP server
 * 5. Send tool result back to OpenAI
 * 6. Get final response and display to user
 */
export function useAgentChat({
  workspaceId,
  model = "gpt-5.2",
  stream = true,
  requireToolApproval = true,
}: UseAgentChatOptions): UseAgentChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toolCallHistory, setToolCallHistory] = useState<ToolCallInfo[]>([]);
  const [availableTools, setAvailableTools] = useState<OpenAITool[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Tool approval state
  const [pendingToolCalls, setPendingToolCalls] = useState<PendingToolCall[]>([]);
  const [isAwaitingApproval, setIsAwaitingApproval] = useState(false);
  const [allowedTools, setAllowedTools] = useState<Set<string>>(new Set());

  const { getAccessTokenSilently } = useAuth0();
  const config = useConfig();

  const agentApiUrl = getAgentApiUrl(config.graphqlUrl);

  // MCP client ref - persists across renders
  const mcpClientRef = useRef<McpClient | null>(null);

  // Refs for approval flow - allows async loop to wait for user decision
  const approvalResolverRef = useRef<((approved: boolean) => void) | null>(null);
  const pendingRawToolCallsRef = useRef<ToolCall[]>([]);

  // Ref to access current allowedTools in async functions
  const allowedToolsRef = useRef<Set<string>>(allowedTools);
  useEffect(() => {
    allowedToolsRef.current = allowedTools;
  }, [allowedTools]);

  // Initialize MCP client and fetch tools
  useEffect(() => {
    let cancelled = false;

    async function initializeMcp() {
      try {
        const getToken = () => getAccessTokenSilently({ cacheMode: "on" });
        const client = new McpClient(config.graphqlUrl, getToken);

        // Initialize the MCP connection
        await client.initialize();

        // Fetch available tools
        const mcpTools = await client.listTools();
        const openaiTools = mcpToolsToOpenAI(mcpTools);

        if (!cancelled) {
          mcpClientRef.current = client;
          setAvailableTools(openaiTools);
          setIsInitialized(true);
          console.log(
            `🔧 MCP initialized with ${openaiTools.length} tools:`,
            openaiTools.map((t) => t.function.name),
          );
        }
      } catch (err) {
        console.error("Failed to initialize MCP client:", err);
        if (!cancelled) {
          setError("Failed to initialize AI tools. Please refresh the page.");
        }
      }
    }

    initializeMcp();

    return () => {
      cancelled = true;
    };
  }, [config.graphqlUrl, getAccessTokenSilently]);

  /**
   * Execute tools via MCP server and return results with tracking info
   */
  const executeToolsViaMcp = useCallback(
    async (
      toolCalls: ToolCall[],
    ): Promise<{ toolResults: ChatMessage[]; toolInfos: ToolCallInfo[] }> => {
      const client = mcpClientRef.current;
      if (!client) {
        throw new Error("MCP client not initialized");
      }

      const results = await Promise.all(
        toolCalls.map(async (toolCall) => {
          const functionName = toolCall.function.name;
          const timestamp = Date.now();
          let parsedArgs: Record<string, unknown> = {};

          try {
            parsedArgs = JSON.parse(toolCall.function.arguments);
          } catch {
            parsedArgs = { raw: toolCall.function.arguments };
          }

          try {
            // Call the tool via MCP server
            const mcpResult = await client.callTool(functionName, parsedArgs);
            const result = parseToolResult(mcpResult);

            return {
              message: {
                role: "tool" as const,
                tool_call_id: toolCall.id,
                content: JSON.stringify(result),
              },
              info: {
                id: toolCall.id,
                name: functionName,
                arguments: parsedArgs,
                result,
                timestamp,
              },
            };
          } catch (error) {
            console.error(`Error executing tool ${functionName}:`, error);
            const errorMsg = error instanceof Error ? error.message : String(error);
            return {
              message: {
                role: "tool" as const,
                tool_call_id: toolCall.id,
                content: JSON.stringify({ error: errorMsg }),
              },
              info: {
                id: toolCall.id,
                name: functionName,
                arguments: parsedArgs,
                error: errorMsg,
                timestamp,
              },
            };
          }
        }),
      );

      return {
        toolResults: results.map((r) => r.message),
        toolInfos: results.map((r) => r.info),
      };
    },
    [],
  );

  const sendMessage = useCallback(
    async (content: string, fileContext?: FileContext) => {
      if (!content.trim() || isLoading || !isInitialized) return;

      // Build the full message content (user message + optional file context)
      let fullContent = content;
      if (fileContext) {
        fullContent = `${fileContext.formattedContent}\n\n[User Question]: ${content}`;
      }

      // Display message shows just the user's text
      const displayMessage: ChatMessage = {
        role: "user",
        content: fileContext ? `📎 ${fileContext.fileName}\n\n${content}` : content,
      };

      // API message includes full context
      const userMessage: ChatMessage = { role: "user", content: fullContent };

      setMessages((prev) => [...prev, displayMessage]);
      setIsLoading(true);
      setError(null);

      try {
        // Get auth token
        const token = await getAccessTokenSilently({ cacheMode: "on" });

        // Build conversation history - filter out error messages and display-only messages
        const validMessages = messages.filter(
          (m) => !m.content?.startsWith("❌ Error:") && m.role !== "tool_display",
        );
        const conversationMessages = [...validMessages, userMessage];
        let iterations = 0;
        const maxIterations = 1000; // Prevent infinite loops

        // Conversation loop: keep going until we get a text response (no tool calls)
        while (iterations < maxIterations) {
          iterations++;

          // For tool call iterations, don't stream (need complete response)
          const shouldStream = stream && iterations === 1;

          // Send to backend API with MCP tools
          const response = await fetch(agentApiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              model,
              messages: conversationMessages,
              tools: availableTools.length > 0 ? availableTools : undefined,
              stream: shouldStream,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          }

          // Handle streaming response
          if (shouldStream && response.body) {
            let assistantContent = "";
            const toolCallMap = new Map<number, Partial<ToolCall>>();

            // Add placeholder message for streaming
            setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n");

                for (const line of lines) {
                  if (line.startsWith("data: ")) {
                    const data = line.slice(6).trim();
                    const parsed = parseSSEData(data);

                    if (parsed.content) {
                      assistantContent += parsed.content;
                      // Update message in real-time
                      setMessages((prev) => {
                        const newMessages = [...prev];
                        const lastIdx = newMessages.length - 1;
                        if (lastIdx >= 0 && newMessages[lastIdx].role === "assistant") {
                          newMessages[lastIdx] = {
                            ...newMessages[lastIdx],
                            content: assistantContent,
                          };
                        }
                        return newMessages;
                      });
                    }

                    // Accumulate tool call deltas
                    accumulateToolCall(toolCallMap, parsed.toolCallDeltas);
                  }
                }
              }
            } finally {
              reader.releaseLock();
            }

            // Convert accumulated tool calls to array
            const toolCalls = Array.from(toolCallMap.values()).filter(
              (tc): tc is ToolCall =>
                !!tc.id && !!tc.function?.name && tc.function?.arguments !== undefined,
            );

            // Check if we got tool calls
            if (toolCalls.length > 0) {
              // Remove the placeholder message
              setMessages((prev) => prev.slice(0, -1));

              // Normalize tool calls to ensure they have required fields
              const normalizedToolCalls = toolCalls.map((tc) => ({
                id: tc.id,
                type: "function" as const,
                function: tc.function,
              }));

              // Add assistant's tool call message to history
              conversationMessages.push({
                role: "assistant",
                content: assistantContent || null,
                tool_calls: normalizedToolCalls,
              });

              // If approval is required, wait for user decision
              if (requireToolApproval) {
                // Check if all tools are already in the allowed list
                const currentAllowedTools = allowedToolsRef.current;
                const allToolsAllowed = normalizedToolCalls.every((tc) =>
                  currentAllowedTools.has(tc.function.name),
                );

                // Only show approval UI if not all tools are pre-approved
                if (!allToolsAllowed) {
                  // Store raw tool calls for execution later
                  pendingRawToolCallsRef.current = normalizedToolCalls;

                  // Convert to pending tool calls for display
                  const pendingCalls: PendingToolCall[] = normalizedToolCalls.map((tc) => {
                    let parsedArgs: Record<string, unknown> = {};
                    try {
                      parsedArgs = JSON.parse(tc.function.arguments);
                    } catch {
                      parsedArgs = { raw: tc.function.arguments };
                    }
                    return {
                      id: tc.id,
                      name: tc.function.name,
                      arguments: parsedArgs,
                      rawArguments: tc.function.arguments,
                    };
                  });

                  setPendingToolCalls(pendingCalls);
                  setIsAwaitingApproval(true);

                  // Wait for user approval
                  const approved = await new Promise<boolean>((resolve) => {
                    approvalResolverRef.current = resolve;
                  });

                  if (!approved) {
                    // User rejected - inform the AI and get a new response
                    conversationMessages.push({
                      role: "tool" as const,
                      tool_call_id: normalizedToolCalls[0].id,
                      content: JSON.stringify({
                        error:
                          "User rejected the tool call request. Please respond without using tools.",
                      }),
                    });
                    continue;
                  }
                }
                // If all tools are allowed, skip approval and continue to execution
              }

              // Execute tools via MCP server and continue loop
              const { toolResults, toolInfos } = await executeToolsViaMcp(normalizedToolCalls);
              conversationMessages.push(...toolResults);

              // Add tool call display to messages
              setMessages((prev) => [
                ...prev,
                { role: "tool_display", content: null, toolCallInfos: toolInfos },
              ]);
              setToolCallHistory((prev) => [...prev, ...toolInfos]);
              continue;
            }

            // Got text response - done!
            break;
          }

          // Non-streaming response
          const data = await response.json();
          const assistantMessage = data.choices[0]?.message;

          if (!assistantMessage) {
            throw new Error("No response from AI");
          }

          // Check if the assistant wants to call tools
          if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
            // Normalize tool calls to ensure they have required fields
            const normalizedToolCalls = assistantMessage.tool_calls.map((tc: ToolCall) => ({
              id: tc.id,
              type: "function" as const,
              function: tc.function,
            }));

            // Add assistant's tool call message to history
            conversationMessages.push({
              role: "assistant" as const,
              content: assistantMessage.content || null,
              tool_calls: normalizedToolCalls,
            });

            // If approval is required, wait for user decision
            if (requireToolApproval) {
              // Check if all tools are already in the allowed list
              const currentAllowedTools = allowedToolsRef.current;
              const allToolsAllowed = normalizedToolCalls.every((tc: ToolCall) =>
                currentAllowedTools.has(tc.function.name),
              );

              // Only show approval UI if not all tools are pre-approved
              if (!allToolsAllowed) {
                // Store raw tool calls for execution later
                pendingRawToolCallsRef.current = normalizedToolCalls;

                // Convert to pending tool calls for display
                const pendingCalls: PendingToolCall[] = normalizedToolCalls.map((tc: ToolCall) => {
                  let parsedArgs: Record<string, unknown> = {};
                  try {
                    parsedArgs = JSON.parse(tc.function.arguments);
                  } catch {
                    parsedArgs = { raw: tc.function.arguments };
                  }
                  return {
                    id: tc.id,
                    name: tc.function.name,
                    arguments: parsedArgs,
                    rawArguments: tc.function.arguments,
                  };
                });

                setPendingToolCalls(pendingCalls);
                setIsAwaitingApproval(true);

                // Wait for user approval
                const approved = await new Promise<boolean>((resolve) => {
                  approvalResolverRef.current = resolve;
                });

                if (!approved) {
                  // User rejected - inform the AI and get a new response
                  conversationMessages.push({
                    role: "tool" as const,
                    tool_call_id: normalizedToolCalls[0].id,
                    content: JSON.stringify({
                      error:
                        "User rejected the tool call request. Please respond without using tools.",
                    }),
                  });
                  continue;
                }
              }
              // If all tools are allowed, skip approval and continue to execution
            }

            // Execute tools via MCP server
            const { toolResults, toolInfos } = await executeToolsViaMcp(normalizedToolCalls);
            conversationMessages.push(...toolResults);

            // Add tool call display to messages
            setMessages((prev) => [
              ...prev,
              { role: "tool_display", content: null, toolCallInfos: toolInfos },
            ]);
            setToolCallHistory((prev) => [...prev, ...toolInfos]);

            // Continue loop to get AI's response based on tool results
          } else {
            // Got a final text response - done!
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: assistantMessage.content || "",
              },
            ]);
            break;
          }
        }

        if (iterations >= maxIterations) {
          throw new Error(
            "Maximum conversation iterations reached. The AI may be stuck in a loop.",
          );
        }
      } catch (err) {
        console.error("Chat error:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to send message";
        setError(errorMessage);

        // Add error message to chat
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `❌ Error: ${errorMessage}`,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      messages,
      isLoading,
      isInitialized,
      model,
      stream,
      requireToolApproval,
      availableTools,
      getAccessTokenSilently,
      agentApiUrl,
      executeToolsViaMcp,
    ],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setToolCallHistory([]);
    setPendingToolCalls([]);
    setIsAwaitingApproval(false);
  }, []);

  /**
   * Approve pending tool calls - triggers execution
   * @param toolsToAlwaysAllow - optional array of tool names to add to allowed list for future auto-approval
   */
  const approveToolCalls = useCallback((toolsToAlwaysAllow?: string[]) => {
    // Add tools to allowed list if specified
    if (toolsToAlwaysAllow && toolsToAlwaysAllow.length > 0) {
      setAllowedTools((prev) => {
        const next = new Set(prev);
        toolsToAlwaysAllow.forEach((tool) => next.add(tool));
        return next;
      });
    }

    if (approvalResolverRef.current) {
      approvalResolverRef.current(true);
      approvalResolverRef.current = null;
    }
    setPendingToolCalls([]);
    setIsAwaitingApproval(false);
  }, []);

  /**
   * Reject pending tool calls - cancels execution
   */
  const rejectToolCalls = useCallback(() => {
    if (approvalResolverRef.current) {
      approvalResolverRef.current(false);
      approvalResolverRef.current = null;
    }
    setPendingToolCalls([]);
    setIsAwaitingApproval(false);
    pendingRawToolCallsRef.current = [];
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    toolCallHistory,
    availableTools,
    isInitialized,
    // Tool approval
    pendingToolCalls,
    isAwaitingApproval,
    approveToolCalls,
    rejectToolCalls,
    // Allowed tools
    allowedTools,
  };
}
