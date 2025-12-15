"use client";

import { useConfig } from "@/providers/ConfigProvider";
import { useApolloClient } from "@apollo/client";
import { useAuth0 } from "@auth0/auth0-react";
import { useCallback, useState } from "react";
import { AGENT_TOOLS, TOOL_EXECUTORS } from "./tools";

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
 * Custom hook for agent chat with tool execution and streaming support
 *
 * This manages the conversation loop:
 * 1. Send user message to backend API (which proxies to OpenAI)
 * 2. If streaming, display tokens as they arrive
 * 3. If OpenAI requests a tool call, execute it locally via GraphQL
 * 4. Send tool result back to OpenAI
 * 5. Get final response and display to user
 */
export function useAgentChat({
  workspaceId,
  model = "gpt-5.2",
  stream = true,
}: UseAgentChatOptions): UseAgentChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toolCallHistory, setToolCallHistory] = useState<ToolCallInfo[]>([]);
  const apolloClient = useApolloClient();
  const { getAccessTokenSilently } = useAuth0();
  const config = useConfig();

  const agentApiUrl = getAgentApiUrl(config.graphqlUrl);

  const sendMessage = useCallback(
    async (content: string, fileContext?: FileContext) => {
      if (!content.trim() || isLoading) return;

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

          // Send to backend API
          const response = await fetch(agentApiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              model,
              messages: conversationMessages,
              tools: AGENT_TOOLS,
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

              // Execute tools and continue loop
              const { toolResults, toolInfos } = await executeToolsWithInfo(
                normalizedToolCalls,
                workspaceId,
                apolloClient,
                () => getAccessTokenSilently({ cacheMode: "on" }),
                config.graphqlUrl,
              );
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

            // Execute tools
            const { toolResults, toolInfos } = await executeToolsWithInfo(
              normalizedToolCalls,
              workspaceId,
              apolloClient,
              () => getAccessTokenSilently({ cacheMode: "on" }),
              config.graphqlUrl,
            );
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
      workspaceId,
      model,
      stream,
      apolloClient,
      getAccessTokenSilently,
      agentApiUrl,
      config.graphqlUrl,
    ],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setToolCallHistory([]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    toolCallHistory,
  };
}

/**
 * Execute tool calls and return results with tracking info
 */
async function executeToolsWithInfo(
  toolCalls: ToolCall[],
  workspaceId: string,
  apolloClient: ReturnType<typeof useApolloClient>,
  getAuthToken: () => Promise<string>,
  graphqlUrl: string,
): Promise<{ toolResults: ChatMessage[]; toolInfos: ToolCallInfo[] }> {
  const results = await Promise.all(
    toolCalls.map(async (toolCall) => {
      const functionName = toolCall.function.name;
      const executor = TOOL_EXECUTORS[functionName];
      const timestamp = Date.now();
      let parsedArgs: Record<string, unknown> = {};

      try {
        parsedArgs = JSON.parse(toolCall.function.arguments);
      } catch {
        parsedArgs = { raw: toolCall.function.arguments };
      }

      if (!executor) {
        const errorMsg = `Unknown tool: ${functionName}`;
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

      try {
        // Inject workspace context and auth for tools that need it
        const argsWithContext = {
          ...parsedArgs,
          workspaceId,
          _getAuthToken: getAuthToken,
          _graphqlUrl: graphqlUrl,
        };

        // Execute the tool
        const result = await executor(argsWithContext, apolloClient as any);

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
}
