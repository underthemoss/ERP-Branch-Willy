/**
 * Agent.ts - The orchestrator with the agentic loop
 *
 * This is a pure TypeScript class that manages:
 * - Message state
 * - The agentic loop (send message → LLM → tool calls → repeat)
 * - State subscriptions for React components
 * - Conversation persistence (auto-save to file system)
 *
 * Dependencies (LLM, Tools) are injected via constructor.
 */

import * as studioFS from "@/lib/studio-fs";
import type { AgentLLM, LLMResponse } from "./AgentLLM";
import type { AgentTool, ToolDefinition } from "./AgentTool";

// ============================================================================
// Types
// ============================================================================

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export type AgentStatus = "idle" | "thinking" | "executing_tools" | "error";

export interface AgentState {
  messages: Message[];
  status: AgentStatus;
  error: string | null;
  tools: ToolDefinition[];
  conversationPath: string | null;
  conversationTitle: string | null;
}

type Subscriber = (state: AgentState) => void;

/**
 * Conversation file format (.chat files)
 */
export interface ConversationFile {
  version: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  messages: Message[];
}

export interface AgentConfig {
  llm: AgentLLM;
  tools: AgentTool;
  systemPrompt: string;
  workspaceId: string;
  onConversationSaved?: (path: string) => void;
}

// ============================================================================
// Agent Class
// ============================================================================

export class Agent {
  private llm: AgentLLM;
  private tools: AgentTool;
  private systemPrompt: string;
  private workspaceId: string;
  private onConversationSaved?: (path: string) => void;

  private messages: Message[] = [];
  private status: AgentStatus = "idle";
  private error: string | null = null;
  private toolDefinitions: ToolDefinition[] = [];

  // Conversation persistence
  private conversationPath: string | null = null;
  private conversationTitle: string | null = null;
  private conversationCreatedAt: string | null = null;
  private isSaving = false;
  private titleGenerated = false;

  private subscribers = new Set<Subscriber>();
  private abortController: AbortController | null = null;

  constructor(config: AgentConfig) {
    this.llm = config.llm;
    this.tools = config.tools;
    this.systemPrompt = config.systemPrompt;
    this.workspaceId = config.workspaceId;
    this.onConversationSaved = config.onConversationSaved;

    // Add system message
    this.messages = [{ role: "system", content: this.systemPrompt }];
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Get current state snapshot
   */
  get state(): AgentState {
    return {
      messages: [...this.messages],
      status: this.status,
      error: this.error,
      tools: [...this.toolDefinitions],
      conversationPath: this.conversationPath,
      conversationTitle: this.conversationTitle,
    };
  }

  /**
   * Subscribe to state changes
   * Returns unsubscribe function
   */
  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Initialize agent - fetch available tools
   */
  async initialize(): Promise<void> {
    try {
      this.toolDefinitions = await this.tools.getToolDefinitions();
      this.notify();
    } catch (err) {
      this.setError(
        `Failed to initialize tools: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Send a user message and run the agentic loop
   */
  async sendMessage(content: string): Promise<void> {
    // Add user message
    this.addMessage({ role: "user", content });

    // Run the agentic loop
    await this.runAgentLoop();
  }

  /**
   * Clear all messages and start a new conversation
   */
  clearMessages(): void {
    this.messages = [{ role: "system", content: this.systemPrompt }];
    this.conversationPath = null;
    this.conversationTitle = null;
    this.conversationCreatedAt = null;
    this.titleGenerated = false;
    this.error = null;
    this.status = "idle";
    this.notify();
  }

  /**
   * Start a new conversation (clear current and reset path)
   */
  newConversation(): void {
    this.clearMessages();
  }

  /**
   * Load a conversation from a file path
   */
  async loadConversation(path: string): Promise<void> {
    try {
      const content = await studioFS.readFile(path);
      if (!content) {
        throw new Error("Conversation file not found");
      }

      const data: ConversationFile = JSON.parse(content);

      // Validate version
      if (data.version !== 1) {
        throw new Error(`Unsupported conversation version: ${data.version}`);
      }

      // Rebuild messages with current system prompt
      this.messages = [{ role: "system", content: this.systemPrompt }, ...data.messages];
      this.conversationPath = path;
      this.conversationTitle = data.title;
      this.conversationCreatedAt = data.createdAt;
      this.titleGenerated = true;
      this.error = null;
      this.status = "idle";
      this.notify();
    } catch (err) {
      this.setError(
        `Failed to load conversation: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Stop the current operation
   */
  stop(): void {
    this.abortController?.abort();
    this.abortController = null;
    this.status = "idle";
    this.notify();
  }

  // ==========================================================================
  // The Agentic Loop
  // ==========================================================================

  private async runAgentLoop(): Promise<void> {
    this.abortController = new AbortController();

    try {
      // Keep looping until we get a response without tool calls
      while (true) {
        // Check if stopped
        if (this.abortController.signal.aborted) {
          break;
        }

        // 1. Call LLM
        this.setStatus("thinking");
        const response = await this.callLLM();

        // Add assistant message
        this.addMessage({
          role: "assistant",
          content: response.content,
          tool_calls: response.tool_calls,
        });

        // 2. Check if done (no tool calls)
        if (!response.tool_calls || response.tool_calls.length === 0) {
          break;
        }

        // 3. Execute ALL tools in parallel
        this.setStatus("executing_tools");
        const toolResults = await this.executeToolCalls(response.tool_calls);

        // 4. Add tool results as messages
        for (const result of toolResults) {
          this.addMessage(result);
        }

        // 5. Loop back to LLM for next iteration
      }

      // Done - back to idle
      this.setStatus("idle");

      // Auto-save conversation after successful completion
      await this.autoSaveConversation();
    } catch (err) {
      if (this.abortController?.signal.aborted) {
        this.setStatus("idle");
      } else {
        this.setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      this.abortController = null;
    }
  }

  private async callLLM(): Promise<LLMResponse> {
    return this.llm.chat(this.messages, this.toolDefinitions);
  }

  private async executeToolCalls(toolCalls: ToolCall[]): Promise<Message[]> {
    const results = await Promise.all(
      toolCalls.map(async (tc) => {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(tc.function.arguments);
        } catch {
          args = { raw: tc.function.arguments };
        }

        try {
          const result = await this.tools.executeTool(tc.function.name, args);
          return {
            role: "tool" as const,
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          };
        } catch (err) {
          return {
            role: "tool" as const,
            tool_call_id: tc.id,
            content: JSON.stringify({
              error: err instanceof Error ? err.message : String(err),
            }),
          };
        }
      }),
    );

    return results;
  }

  // ==========================================================================
  // State Management
  // ==========================================================================

  private addMessage(message: Message): void {
    this.messages = [...this.messages, message];
    this.notify();
  }

  private setStatus(status: AgentStatus): void {
    this.status = status;
    this.error = null;
    this.notify();
  }

  private setError(error: string): void {
    this.status = "error";
    this.error = error;
    this.notify();
  }

  private notify(): void {
    const state = this.state;
    this.subscribers.forEach((callback) => callback(state));
  }

  // ==========================================================================
  // Conversation Persistence
  // ==========================================================================

  /**
   * Auto-save the conversation after each assistant response.
   * Creates the /conversations folder if it doesn't exist.
   * Generates a title using LLM on first save.
   */
  private async autoSaveConversation(): Promise<void> {
    // Don't save if already saving or no real messages
    if (this.isSaving) return;

    // Check if there's at least one user message and one assistant message
    const userMessages = this.messages.filter((m) => m.role === "user");
    const assistantMessages = this.messages.filter((m) => m.role === "assistant");
    if (userMessages.length === 0 || assistantMessages.length === 0) return;

    this.isSaving = true;

    try {
      // Ensure /conversations folder exists
      const conversationsDir = "/conversations";
      const dirExists = await studioFS.exists(conversationsDir);
      if (!dirExists) {
        await studioFS.mkdir(conversationsDir);
      }

      // Generate title if this is a new conversation
      if (!this.titleGenerated) {
        try {
          const title = await this.llm.generateTitle(this.messages);
          this.conversationTitle = title;
          this.titleGenerated = true;

          // Generate filename from title
          const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
          const filename = `${this.conversationTitle}-${timestamp}.chat`;
          this.conversationPath = `${conversationsDir}/${filename}`;
          this.conversationCreatedAt = new Date().toISOString();
        } catch (err) {
          console.error("Failed to generate title:", err);
          // Fall back to timestamp-based name
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          this.conversationTitle = "untitled-conversation";
          this.conversationPath = `${conversationsDir}/conversation-${timestamp}.chat`;
          this.conversationCreatedAt = new Date().toISOString();
          this.titleGenerated = true;
        }
      }

      // Build conversation file content (exclude system message)
      const messagesWithoutSystem = this.messages.filter((m) => m.role !== "system");
      const conversationFile: ConversationFile = {
        version: 1,
        title: this.conversationTitle || "Untitled",
        createdAt: this.conversationCreatedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workspaceId: this.workspaceId,
        messages: messagesWithoutSystem,
      };

      // Save to file system
      await studioFS.writeFile(this.conversationPath!, JSON.stringify(conversationFile, null, 2));

      // Notify callback if provided
      if (this.onConversationSaved && this.conversationPath) {
        this.onConversationSaved(this.conversationPath);
      }

      // Update state to reflect saved path
      this.notify();
    } catch (err) {
      console.error("Failed to auto-save conversation:", err);
    } finally {
      this.isSaving = false;
    }
  }
}
