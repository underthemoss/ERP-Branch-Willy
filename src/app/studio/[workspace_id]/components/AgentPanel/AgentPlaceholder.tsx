"use client";

import {
  formatFileForContext,
  formatFileSize,
  isSupportedFileType,
  ParsedFile,
  parseFile,
} from "@/lib/agent/fileParser";
import { FileContext, PendingToolCall, ToolCallInfo, useAgentChat } from "@/lib/agent/useAgentChat";
import { useSelectedWorkspaceId } from "@/providers/WorkspaceProvider";
import {
  Bot,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Paperclip,
  Send,
  Wrench,
  X,
  XCircle,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ToolCallSectionProps {
  toolCalls: ToolCallInfo[];
}

function ToolCallSection({ toolCalls }: ToolCallSectionProps) {
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

  const toggleTool = (id: string) => {
    setExpandedTools((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (toolCalls.length === 0) return null;

  return (
    <div className="mb-2 space-y-1">
      {toolCalls.map((tc) => {
        const isExpanded = expandedTools.has(tc.id);
        const hasError = !!tc.error;

        return (
          <div key={tc.id} className="border border-[#E5E5E5] rounded bg-[#FAFAFA] text-[12px]">
            <button
              onClick={() => toggleTool(tc.id)}
              className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-[#F0F0F0] transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
              )}
              <Wrench className="w-3 h-3 text-[#007ACC] flex-shrink-0" />
              <span className="font-mono text-[11px] text-gray-700 flex-1 text-left truncate">
                {tc.name}
              </span>
              {hasError ? (
                <XCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
              )}
            </button>

            {isExpanded && (
              <div className="px-2 pb-2 pt-1 border-t border-[#E5E5E5] space-y-2">
                {/* Arguments */}
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase mb-1">
                    Arguments
                  </div>
                  <pre className="text-[10px] font-mono bg-[#1e293b] text-[#e2e8f0] p-2 rounded overflow-x-auto max-h-24">
                    {JSON.stringify(tc.arguments, null, 2)}
                  </pre>
                </div>

                {/* Result or Error */}
                {hasError ? (
                  <div>
                    <div className="text-[10px] font-semibold text-red-600 uppercase mb-1">
                      Error
                    </div>
                    <div className="text-[11px] text-red-600 bg-red-50 p-2 rounded">{tc.error}</div>
                  </div>
                ) : tc.result !== undefined ? (
                  <div>
                    <div className="text-[10px] font-semibold text-gray-500 uppercase mb-1">
                      Result
                    </div>
                    <pre className="text-[10px] font-mono bg-[#1e293b] text-[#e2e8f0] p-2 rounded overflow-x-auto max-h-32">
                      {JSON.stringify(tc.result, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface PendingToolApprovalProps {
  pendingToolCalls: PendingToolCall[];
  allowedTools: Set<string>;
  onApprove: (toolsToAlwaysAllow?: string[]) => void;
  onReject: () => void;
}

function PendingToolApproval({
  pendingToolCalls,
  allowedTools,
  onApprove,
  onReject,
}: PendingToolApprovalProps) {
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  // Track which tools to "always allow" - pre-checked if already in allowedTools
  const [toolsToAllow, setToolsToAllow] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    pendingToolCalls.forEach((tc) => {
      if (allowedTools.has(tc.name)) {
        initial.add(tc.name);
      }
    });
    return initial;
  });

  const toggleTool = (id: string) => {
    setExpandedTools((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleApprove = () => {
    // Get list of newly checked tools (not already in allowedTools)
    const newToolsToAllow = Array.from(toolsToAllow).filter((t) => !allowedTools.has(t));
    onApprove(newToolsToAllow.length > 0 ? newToolsToAllow : undefined);
  };

  return (
    <div className="mb-2 space-y-1">
      {pendingToolCalls.map((tc) => {
        const isExpanded = expandedTools.has(tc.id);
        const isAlreadyAllowed = allowedTools.has(tc.name);
        const willAllow = toolsToAllow.has(tc.name);

        return (
          <div key={tc.id} className="border border-[#E5E5E5] rounded bg-[#FAFAFA] text-[12px]">
            <div className="flex items-center">
              <button
                onClick={() => toggleTool(tc.id)}
                className="flex-1 flex items-center gap-2 px-2 py-1.5 hover:bg-[#F0F0F0] transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                )}
                <Wrench className="w-3 h-3 text-[#007ACC] flex-shrink-0" />
                <span className="font-mono text-[11px] text-gray-700 flex-1 text-left truncate">
                  {tc.name}
                </span>
                {isAlreadyAllowed ? (
                  <span className="text-[9px] text-green-600 uppercase tracking-wide">allowed</span>
                ) : (
                  <span className="text-[9px] text-gray-400 uppercase tracking-wide">pending</span>
                )}
              </button>
              {/* Always allow checkbox */}
              <label
                className="flex items-center gap-1 px-2 py-1.5 cursor-pointer hover:bg-[#F0F0F0]"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={willAllow}
                  onChange={() =>
                    setToolsToAllow((prev) => {
                      const next = new Set(prev);
                      if (next.has(tc.name)) {
                        next.delete(tc.name);
                      } else {
                        next.add(tc.name);
                      }
                      return next;
                    })
                  }
                  disabled={isAlreadyAllowed}
                  className="w-3 h-3 rounded border-gray-300 text-[#007ACC] focus:ring-[#007ACC] focus:ring-1 disabled:opacity-50"
                />
                <span className="text-[9px] text-gray-500 whitespace-nowrap">Always allow</span>
              </label>
            </div>

            {isExpanded && (
              <div className="px-2 pb-2 pt-1 border-t border-[#E5E5E5] space-y-2">
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase mb-1">
                    Arguments
                  </div>
                  <pre className="text-[10px] font-mono bg-[#1e293b] text-[#e2e8f0] p-2 rounded overflow-x-auto max-h-24">
                    {JSON.stringify(tc.arguments, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Compact action bar */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-[10px] text-gray-500">
          {pendingToolCalls.length} tool{pendingToolCalls.length > 1 ? "s" : ""} require approval
        </span>
        <div className="flex-1" />
        <button
          onClick={onReject}
          className="px-2 py-1 text-[11px] font-medium text-gray-600 bg-white border border-[#D4D4D4] rounded hover:bg-gray-50 transition-colors"
        >
          Reject
        </button>
        <button
          onClick={handleApprove}
          className="px-2 py-1 text-[11px] font-medium text-white bg-[#007ACC] rounded hover:bg-[#005A9E] transition-colors"
        >
          Approve
        </button>
      </div>
    </div>
  );
}

interface AttachedFileProps {
  file: File;
  parsedFile: ParsedFile | null;
  isParsing: boolean;
  parseError: string | null;
  onRemove: () => void;
}

function AttachedFile({ file, parsedFile, isParsing, parseError, onRemove }: AttachedFileProps) {
  const getFileIcon = () => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "📄";
    if (ext === "csv") return "📊";
    return "📎";
  };

  const getMetaInfo = () => {
    if (isParsing) return "Parsing...";
    if (parseError) return "Error";
    if (!parsedFile) return formatFileSize(file.size);

    if (parsedFile.fileType === "csv") {
      return `${parsedFile.metadata.rowCount} rows`;
    }
    if (parsedFile.fileType === "pdf") {
      return `${parsedFile.metadata.pageCount} pages`;
    }
    return formatFileSize(file.size);
  };

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 rounded text-[12px] ${
        parseError ? "bg-red-50 border border-red-200" : "bg-[#E8F4FD] border border-[#B8DAEF]"
      }`}
    >
      {isParsing ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#007ACC]" />
      ) : parseError ? (
        <XCircle className="w-3.5 h-3.5 text-red-500" />
      ) : (
        <span className="text-sm">{getFileIcon()}</span>
      )}
      <div className="flex-1 min-w-0">
        <div className="truncate font-medium text-gray-700">{file.name}</div>
        <div className={`text-[10px] ${parseError ? "text-red-500" : "text-gray-500"}`}>
          {parseError || getMetaInfo()}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="p-0.5 hover:bg-black/10 rounded transition-colors"
        title="Remove file"
      >
        <X className="w-3.5 h-3.5 text-gray-500" />
      </button>
    </div>
  );
}

export function AgentPanel() {
  const workspaceId = useSelectedWorkspaceId();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File attachment state
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Auto-approve state
  const [autoApprove, setAutoApprove] = useState(false);

  const {
    messages,
    isLoading,
    sendMessage,
    pendingToolCalls,
    isAwaitingApproval,
    approveToolCalls,
    rejectToolCalls,
    allowedTools,
  } = useAgentChat({
    workspaceId: workspaceId || "",
    requireToolApproval: !autoApprove,
  });

  // Auto-scroll to bottom when new messages arrive or pending tools appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingToolCalls]);

  // Parse file when attached
  useEffect(() => {
    if (!attachedFile) {
      setParsedFile(null);
      setParseError(null);
      return;
    }

    const parseAttachedFile = async () => {
      setIsParsing(true);
      setParseError(null);
      try {
        const result = await parseFile(attachedFile);
        setParsedFile(result);
      } catch (err) {
        console.error("File parse error:", err);
        setParseError(err instanceof Error ? err.message : "Failed to parse file");
        setParsedFile(null);
      } finally {
        setIsParsing(false);
      }
    };

    parseAttachedFile();
  }, [attachedFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isSupportedFileType(file)) {
      setParseError("Unsupported file type. Please upload a PDF or CSV file.");
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setParseError("File too large. Maximum size is 10MB.");
      return;
    }

    setAttachedFile(file);
    // Reset file input so same file can be re-selected
    e.target.value = "";
  }, []);

  const handleRemoveFile = useCallback(() => {
    setAttachedFile(null);
    setParsedFile(null);
    setParseError(null);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !workspaceId) return;

    // Build file context if we have a parsed file
    let fileContext: FileContext | undefined;
    if (parsedFile) {
      fileContext = {
        fileName: parsedFile.fileName,
        formattedContent: formatFileForContext(parsedFile),
      };
    }

    const messageText = input;
    setInput("");
    setAttachedFile(null);
    setParsedFile(null);

    await sendMessage(messageText, fileContext);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!workspaceId) {
    return (
      <div className="h-full flex items-center justify-center p-5">
        <div className="text-center">
          <Bot className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-[13px] text-gray-500">No workspace selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#F3F3F3]">
      {/* Header */}
      <div className="p-2 px-3 border-b border-[#E5E5E5] bg-white">
        <div className="flex items-center gap-1.5">
          <Bot className="w-4 h-4 text-[#007ACC]" />
          <span className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
            AI Agent
          </span>
          <div className="flex-1" />
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              className="w-3 h-3 rounded border-gray-300 text-[#007ACC] focus:ring-[#007ACC] focus:ring-1"
            />
            <span className="text-[10px] text-gray-500">Auto-approve all</span>
          </label>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-[280px]">
              <Bot className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <h3 className="text-base font-semibold text-[#383838] mb-1">AI Agent</h3>
              <p className="text-[13px] text-gray-500 mb-2 leading-relaxed">
                Ask me about your workspace data. I can help you find projects, contacts, and more.
              </p>
              <p className="text-[11px] text-gray-400 mb-1">Try asking:</p>
              <div className="text-xs text-gray-500 leading-relaxed text-left space-y-0.5">
                <div>• &quot;Show me all projects&quot;</div>
                <div>• &quot;List active contacts&quot;</div>
                <div>• 📎 Attach a CSV or PDF for analysis</div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, idx) => {
              // Render tool_display messages as expandable sections
              if (message.role === "tool_display" && message.toolCallInfos) {
                return (
                  <div key={idx}>
                    <ToolCallSection toolCalls={message.toolCallInfos} />
                  </div>
                );
              }

              // Skip tool messages (they're internal)
              if (message.role === "tool") {
                return null;
              }

              return (
                <div key={idx}>
                  <div
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-[13px] ${
                        message.role === "user"
                          ? "bg-[#007ACC] text-white"
                          : "bg-white text-gray-800 border border-[#E5E5E5]"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <Bot className="w-3 h-3 text-[#007ACC]" />
                          <span className="text-[10px] font-semibold text-gray-500 uppercase">
                            AI
                          </span>
                        </div>
                      )}
                      {message.role === "assistant" ? (
                        <div className="agent-markdown">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content ?? ""}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pending tool approval UI */}
            {isAwaitingApproval && pendingToolCalls.length > 0 && (
              <PendingToolApproval
                pendingToolCalls={pendingToolCalls}
                allowedTools={allowedTools}
                onApprove={approveToolCalls}
                onReject={rejectToolCalls}
              />
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-[#E5E5E5] bg-white space-y-2">
        {/* Awaiting approval indicator */}
        {isAwaitingApproval && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded text-[11px] bg-[#F5F5F5] border border-[#E0E0E0]">
            <Loader2 className="w-3 h-3 animate-spin text-gray-500" />
            <span className="text-gray-600">Awaiting tool approval</span>
          </div>
        )}

        {/* Attached file preview */}
        {(attachedFile || parseError) && !isAwaitingApproval && (
          <AttachedFile
            file={attachedFile!}
            parsedFile={parsedFile}
            isParsing={isParsing}
            parseError={parseError}
            onRemove={handleRemoveFile}
          />
        )}

        {/* Input row */}
        <div className="flex gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Attach button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isParsing || isAwaitingApproval}
            className="p-2 text-gray-500 hover:text-[#007ACC] hover:bg-[#F0F0F0] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Attach PDF or CSV"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Text input */}
          <input
            type="text"
            placeholder={
              isAwaitingApproval
                ? "Approve or reject the tool request above..."
                : attachedFile
                  ? "Ask about this file..."
                  : "Ask me anything..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isAwaitingApproval}
            className="flex-1 px-3 py-2 text-[13px] bg-white border border-[#E5E5E5] rounded focus:outline-none focus:ring-2 focus:ring-[#007ACC] disabled:bg-gray-50 disabled:text-gray-400"
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || isParsing || isAwaitingApproval}
            className="px-4 py-2 bg-[#007ACC] text-white text-[13px] font-medium rounded hover:bg-[#005A9E] disabled:bg-[#007ACC]/50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
