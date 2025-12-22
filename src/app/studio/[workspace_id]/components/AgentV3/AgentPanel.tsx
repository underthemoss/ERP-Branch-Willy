"use client";

/**
 * AgentPanel.tsx - All UI in one file
 *
 * Contains:
 * - useAgentState hook (subscribes to Agent state)
 * - Message components (User, Assistant, Tool)
 * - AgentPanel (main panel with input)
 */
import { useConfig } from "@/providers/ConfigProvider";
import { useSelectedWorkspace } from "@/providers/WorkspaceProvider";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Bot,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  Send,
  StopCircle,
  User,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useConversationStore } from "../../store/conversationStore";
import { Agent, AgentState, Message } from "./Agent";
import { OpenAILLM } from "./AgentLLM";
import { CombinedToolRunner } from "./AgentTool";

// ============================================================================
// useAgentState Hook
// ============================================================================

function useAgentState(agent: Agent | null): AgentState | null {
  const [state, setState] = useState<AgentState | null>(agent?.state ?? null);

  useEffect(() => {
    if (!agent) return;

    // Set initial state
    setState(agent.state);

    // Subscribe to changes
    return agent.subscribe(setState);
  }, [agent]);

  return state;
}

// ============================================================================
// System Prompt
// ============================================================================

function getSystemPrompt(workspaceId: string, workspaceName: string): string {
  const workspaceInfo = `**Current Workspace: ${workspaceName}** (ID: ${workspaceId})`;

  return `You are an ERP Assistant helping users manage their workspace in an equipment rental and sales platform.

${workspaceInfo}
Always use this workspace ID when making tool calls that require it.

## Your Capabilities

You can help users with:
- **Projects**: Create, update, search, and manage projects
- **Contacts**: Manage business contacts and person contacts
- **Sales Orders & Purchase Orders**: Create, view, and manage orders
- **Quotes & RFQs**: Generate quotes, manage quote revisions
- **Inventory**: Track inventory items, manage stock levels
- **Invoices**: Create and manage invoices
- **Pricing**: Manage price books, rental prices, and sale prices

## Local File Tools

You have access to a git-backed file system for creating guides and documentation:
- read_file: Read file contents
- write_file: Create/update files (each write creates a commit)
- list_directory: List directory contents
- delete_file: Delete files
- undo: Undo the last file change
- redo: Redo a previously undone change
- get_history: View commit history

## Guidelines

1. Always include the workspace ID (${workspaceId}) in relevant tool calls
2. Be helpful and proactive in suggesting actions
3. Format responses clearly with appropriate structure`;
}

// ============================================================================
// Message Context - shared by all message components
// ============================================================================

interface MessageContext {
  messages: Message[];
  index: number;
}

// ============================================================================
// Message Components
// ============================================================================

function UserMessage({ messages, index }: MessageContext) {
  const message = messages[index];
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-lg px-3 py-2 text-[13px] bg-[#007ACC] text-white">
        <div className="flex items-center gap-1.5 mb-1">
          <User className="w-3 h-3" />
          <span className="text-[10px] font-semibold uppercase opacity-80">You</span>
        </div>
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
}

function AssistantMessage({ messages, index }: MessageContext) {
  const message = messages[index];
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const hasToolCalls = message.tool_calls && message.tool_calls.length > 0;

  // Infer if tools are still executing by checking for missing tool results
  const isExecuting = (() => {
    if (!message.tool_calls?.length) return false;

    // Collect all completed tool call IDs from the entire conversation
    const completedToolIds = new Set(
      messages
        .filter(
          (m): m is Message & { tool_call_id: string } => m.role === "tool" && !!m.tool_call_id,
        )
        .map((m) => m.tool_call_id),
    );

    // Still executing if any of our tool calls don't have results
    return message.tool_calls.some((tc) => !completedToolIds.has(tc.id));
  })();

  const toggleExpanded = (toolCallId: string) => {
    setExpandedTools((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(toolCallId)) {
        newSet.delete(toolCallId);
      } else {
        newSet.add(toolCallId);
      }
      return newSet;
    });
  };

  const formatArgs = (argsString: string): Record<string, unknown> | null => {
    try {
      return JSON.parse(argsString);
    } catch {
      return null;
    }
  };

  // Find the tool result for a given tool call ID
  const getToolResult = (toolCallId: string): unknown | null => {
    const toolMessage = messages.find((m) => m.role === "tool" && m.tool_call_id === toolCallId);
    if (!toolMessage?.content) return null;
    try {
      return JSON.parse(toolMessage.content);
    } catch {
      return toolMessage.content;
    }
  };

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-lg px-3 py-2 text-[13px] bg-white text-gray-800 border border-[#E5E5E5]">
        <div className="flex items-center gap-1.5 mb-1">
          <Bot className="w-3 h-3 text-[#007ACC]" />
          <span className="text-[10px] font-semibold text-gray-500 uppercase">AI</span>
        </div>

        {/* Text content */}
        {message.content && (
          <div className="agent-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}

        {/* Tool calls */}
        {hasToolCalls && (
          <div className="mt-2 space-y-1">
            {message.tool_calls?.map((tc) => {
              const isExpanded = expandedTools.has(tc.id);
              const args = formatArgs(tc.function.arguments);

              const result = getToolResult(tc.id);
              const hasError = Boolean(
                result && typeof result === "object" && result !== null && "error" in result,
              );

              return (
                <div key={tc.id} className="text-[12px] text-gray-600">
                  <div className="flex items-center gap-2">
                    {isExecuting ? (
                      <Loader2 className="w-3 h-3 animate-spin text-[#007ACC]" />
                    ) : (
                      <Wrench
                        className={`w-3 h-3 ${hasError ? "text-red-500" : "text-[#007ACC]"}`}
                      />
                    )}
                    <span className="font-mono">{tc.function.name}</span>
                    {isExecuting && <span className="text-[10px] text-gray-400">executing...</span>}
                    {!isExecuting && hasError && (
                      <span className="text-[10px] text-red-500">✗</span>
                    )}
                    {!isExecuting && !hasError && (
                      <span className="text-[10px] text-green-500">✓</span>
                    )}
                    {args && (
                      <button
                        onClick={() => toggleExpanded(tc.id)}
                        className="ml-auto p-0.5 hover:bg-gray-100 rounded transition-colors"
                        title={isExpanded ? "Collapse params" : "Expand params"}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-gray-400" />
                        )}
                      </button>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="mt-1 ml-5 space-y-2">
                      <>
                        {args && (
                          <div className="p-1.5 bg-[#F5F5F5] rounded text-[10px] font-mono overflow-x-auto">
                            <div className="text-[9px] text-gray-400 uppercase mb-1">Input</div>
                            {Object.entries(args).map(([key, value]) => {
                              const displayValue =
                                typeof value === "string" && value.length > 100
                                  ? value.slice(0, 100) + "..."
                                  : String(JSON.stringify(value));
                              return (
                                <div key={key} className="flex gap-2">
                                  <span className="text-[#007ACC] flex-shrink-0">{key}:</span>
                                  <span className="text-gray-700 break-all whitespace-pre-wrap">
                                    {displayValue}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {!isExecuting && result && (
                          <div
                            className={`p-1.5 rounded text-[10px] font-mono overflow-x-auto ${
                              hasError ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
                            }`}
                          >
                            <div
                              className={`text-[9px] uppercase mb-1 ${hasError ? "text-red-400" : "text-green-500"}`}
                            >
                              {hasError ? "Error" : "Result"}
                            </div>
                            <pre className="whitespace-pre-wrap break-all">
                              {String(JSON.stringify(result, null, 2)).slice(0, 500)}
                            </pre>
                          </div>
                        )}
                      </>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Tool messages are now displayed inline with AssistantMessage
function ToolMessage(_props: MessageContext) {
  return null;
}

function MessageList({ messages, status }: { messages: Message[]; status: string }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {messages.map((msg, idx) => {
        // Skip system messages
        if (msg.role === "system") return null;

        const context: MessageContext = { messages, index: idx };

        if (msg.role === "user") {
          return <UserMessage key={idx} {...context} />;
        }

        if (msg.role === "assistant") {
          return <AssistantMessage key={idx} {...context} />;
        }

        if (msg.role === "tool") {
          return <ToolMessage key={idx} {...context} />;
        }

        return null;
      })}

      {/* Thinking indicator */}
      {status === "thinking" && (
        <div className="flex justify-start">
          <div className="rounded-lg px-3 py-2 bg-white border border-[#E5E5E5]">
            <div className="flex items-center gap-2 text-[12px] text-gray-500">
              <Loader2 className="w-3 h-3 animate-spin text-[#007ACC]" />
              <span>Thinking...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

// ============================================================================
// AgentPanel Component
// ============================================================================

interface AgentPanelProps {
  workspaceId: string;
}

export function AgentPanel({ workspaceId }: AgentPanelProps) {
  const [input, setInput] = useState("");
  const [agent, setAgent] = useState<Agent | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { getAccessTokenSilently } = useAuth0();
  const config = useConfig();
  const workspace = useSelectedWorkspace();

  // Conversation store for cross-component communication
  const { loadRequestPath, loadRequestTimestamp, clearLoadRequest, setActiveConversationPath } =
    useConversationStore();

  // Create agent instance only when workspace is loaded
  useEffect(() => {
    // Wait for workspace to be loaded
    if (!workspace) return;

    const apiUrl = new URL(config.graphqlUrl);
    const pathPrefix = apiUrl.pathname.replace(/\/graphql$/, "");
    const chatUrl = `${apiUrl.protocol}//${apiUrl.host}${pathPrefix}/api/agent/chat`;

    const llm = new OpenAILLM({
      apiUrl: chatUrl,
      getAuthToken: () => getAccessTokenSilently({ cacheMode: "on" }),
    });

    const tools = new CombinedToolRunner({
      graphqlUrl: config.graphqlUrl,
      getAuthToken: () => getAccessTokenSilently({ cacheMode: "on" }),
    });

    const newAgent = new Agent({
      llm,
      tools,
      systemPrompt: getSystemPrompt(workspaceId, workspace.name),
      workspaceId,
      onConversationSaved: (path) => {
        setActiveConversationPath(path);
      },
    });

    // Initialize (fetch tools)
    newAgent.initialize().catch((err) => {
      setInitError(err instanceof Error ? err.message : String(err));
    });

    setAgent(newAgent);

    // Cleanup
    return () => {
      newAgent.stop();
    };
  }, [
    config.graphqlUrl,
    getAccessTokenSilently,
    workspaceId,
    workspace,
    setActiveConversationPath,
  ]);

  // Handle conversation load requests from FileExplorer
  useEffect(() => {
    if (!agent || !loadRequestPath) return;

    // Load the conversation
    agent.loadConversation(loadRequestPath).then(() => {
      setActiveConversationPath(loadRequestPath);
      clearLoadRequest();
    });
  }, [agent, loadRequestPath, loadRequestTimestamp, clearLoadRequest, setActiveConversationPath]);

  const state = useAgentState(agent);

  const handleSend = useCallback(() => {
    if (!agent || !input.trim()) return;

    const message = input.trim();
    setInput("");
    agent.sendMessage(message);
  }, [agent, input]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleNewConversation = useCallback(() => {
    agent?.newConversation();
    setActiveConversationPath(null);
  }, [agent, setActiveConversationPath]);

  const handleStop = useCallback(() => {
    agent?.stop();
  }, [agent]);

  const isLoading = state?.status === "thinking" || state?.status === "executing_tools";

  // Error state
  if (initError) {
    return (
      <div className="h-full flex flex-col bg-[#F5F5F5]">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-red-500">
            <p className="font-semibold">Failed to initialize</p>
            <p className="text-sm mt-1">{initError}</p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (!state) {
    return (
      <div className="h-full flex flex-col bg-[#F5F5F5]">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#007ACC]" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#F5F5F5]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#E5E5E5] bg-white">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Bot className="w-4 h-4 text-[#007ACC] flex-shrink-0" />
          {state.conversationTitle ? (
            <span
              className="text-[12px] font-semibold text-gray-700 truncate"
              title={state.conversationTitle}
            >
              {state.conversationTitle}
            </span>
          ) : (
            <>
              <span className="text-[12px] font-semibold text-gray-700">AI Assistant</span>
              <span className="text-[10px] text-gray-400">v3</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isLoading && (
            <button onClick={handleStop} className="p-1 hover:bg-gray-100 rounded" title="Stop">
              <StopCircle className="w-4 h-4 text-red-500" />
            </button>
          )}
          <button
            onClick={handleNewConversation}
            className="p-1 hover:bg-gray-100 rounded"
            title="New conversation"
          >
            <Plus className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {state.error && (
        <div className="px-3 py-2 bg-red-50 border-b border-red-200 text-red-600 text-[12px]">
          {state.error}
        </div>
      )}

      {/* Messages */}
      <MessageList messages={state.messages} status={state.status} />

      {/* Input */}
      <div className="p-3 border-t border-[#E5E5E5] bg-white">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the AI assistant..."
            className="flex-1 resize-none rounded border border-[#E5E5E5] px-3 py-2 text-[13px] focus:outline-none focus:border-[#007ACC] min-h-[40px] max-h-[120px]"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-3 py-2 bg-[#007ACC] text-white rounded hover:bg-[#006BB3] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
