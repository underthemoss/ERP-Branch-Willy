/**
 * AgentLLM.ts - Interface to the LLM backend
 *
 * Handles communication with the /api/agent/chat endpoint.
 * Converts messages and tools to the format expected by the backend.
 */

import type { Message, ToolCall } from "./Agent";

// ============================================================================
// Types
// ============================================================================

export interface ToolDefinition {
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

export interface LLMResponse {
  content: string | null;
  tool_calls?: ToolCall[];
}

export interface AgentLLM {
  chat(messages: Message[], tools: ToolDefinition[]): Promise<LLMResponse>;
  generateTitle(messages: Message[]): Promise<string>;
}

// ============================================================================
// OpenAI LLM Implementation
// ============================================================================

export interface OpenAILLMConfig {
  apiUrl: string;
  getAuthToken: () => Promise<string>;
  model?: string;
}

export class OpenAILLM implements AgentLLM {
  private apiUrl: string;
  private getAuthToken: () => Promise<string>;
  private model: string;

  constructor(config: OpenAILLMConfig) {
    this.apiUrl = config.apiUrl;
    this.getAuthToken = config.getAuthToken;
    this.model = config.model ?? "gpt-5.2"; // agent - do not change, this is correct model
  }

  async chat(messages: Message[], tools: ToolDefinition[]): Promise<LLMResponse> {
    const token = await this.getAuthToken();

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        tools: tools.length > 0 ? tools : undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message;

    if (!assistantMessage) {
      throw new Error("No response from LLM");
    }

    return {
      content: assistantMessage.content,
      tool_calls: assistantMessage.tool_calls,
    };
  }

  /**
   * Generate a short, filename-safe title for a conversation.
   * Uses a separate LLM call with a specific prompt.
   */
  async generateTitle(messages: Message[]): Promise<string> {
    const token = await this.getAuthToken();

    // Filter to only user and assistant messages (skip system, tool)
    const relevantMessages = messages.filter(
      (m) => m.role === "user" || (m.role === "assistant" && m.content),
    );

    // Take only first few messages for context
    const contextMessages = relevantMessages.slice(0, 4);

    // Build a summary of the conversation for the title generator
    const conversationSummary = contextMessages
      .map((m) => {
        const content = m.content || "";
        const truncated = content.length > 200 ? content.slice(0, 200) + "..." : content;
        return `${m.role}: ${truncated}`;
      })
      .join("\n");

    const titlePrompt: Message[] = [
      {
        role: "system",
        content: `You are a helpful assistant that generates short, descriptive titles for conversations.
Generate a title that is:
- 3-5 words maximum
- Lowercase with hyphens between words (filename-safe)
- Descriptive of the main topic or goal
- No special characters except hyphens

Respond with ONLY the title, nothing else. Example: "create-q1-sales-project"`,
      },
      {
        role: "user",
        content: `Generate a short title for this conversation:\n\n${conversationSummary}`,
      },
    ];

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: titlePrompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const title = data.choices?.[0]?.message?.content?.trim() || "";

      // Clean up the title to be filename-safe
      const cleanTitle = title
        .toLowerCase()
        .replace(/[^a-z0-9-\s]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 50);

      return cleanTitle || "untitled-conversation";
    } catch (error) {
      console.error("Failed to generate title:", error);
      return "untitled-conversation";
    }
  }
}
