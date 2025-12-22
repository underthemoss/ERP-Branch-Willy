import { create } from "zustand";

/**
 * Store for managing conversation state across components.
 * When a .chat file is clicked in FileExplorer, it signals the AgentPanel to load it.
 */

interface ConversationStore {
  /**
   * The path of the currently active conversation file (null if new conversation)
   */
  activeConversationPath: string | null;

  /**
   * Signal to request loading a conversation from a file path.
   * This is set when the user clicks a .chat file in FileExplorer.
   */
  loadRequestPath: string | null;

  /**
   * Timestamp of the load request (to detect new requests for same path)
   */
  loadRequestTimestamp: number;

  /**
   * Request to load a conversation from a file path.
   * Called by FileExplorer when user clicks a .chat file.
   */
  requestLoadConversation: (path: string) => void;

  /**
   * Clear the load request after it's been processed.
   * Called by AgentPanel after loading the conversation.
   */
  clearLoadRequest: () => void;

  /**
   * Set the active conversation path.
   * Called by AgentPanel when a conversation is loaded or saved.
   */
  setActiveConversationPath: (path: string | null) => void;
}

export const useConversationStore = create<ConversationStore>((set) => ({
  activeConversationPath: null,
  loadRequestPath: null,
  loadRequestTimestamp: 0,

  requestLoadConversation: (path: string) => {
    set({
      loadRequestPath: path,
      loadRequestTimestamp: Date.now(),
    });
  },

  clearLoadRequest: () => {
    set({
      loadRequestPath: null,
    });
  },

  setActiveConversationPath: (path: string | null) => {
    set({
      activeConversationPath: path,
    });
  },
}));
