import { create } from "zustand";

export interface Tab {
  id: string;
  type:
    | "pricebook"
    | "project"
    | "contact"
    | "price"
    | "file"
    | "chat"
    | "markdown"
    | "csv"
    | "json";
  entityId: string;
  label: string;
}

interface TabStore {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (type: Tab["type"], entityId: string, label: string) => void;
  closeTab: (id: string) => void;
  closeOtherTabs: (id: string) => void;
  closeTabsToRight: (id: string) => void;
  closeAllTabs: () => void;
  setActiveTab: (id: string) => void;
}

export const useTabStore = create<TabStore>((set) => ({
  tabs: [],
  activeTabId: null,

  openTab: (type, entityId, label) => {
    set((state) => {
      // Check if tab already exists (must match both type AND entityId)
      const existingTab = state.tabs.find((tab) => tab.entityId === entityId && tab.type === type);
      if (existingTab) {
        return { activeTabId: existingTab.id };
      }

      // Create new tab
      const newTab: Tab = {
        id: `${type}-${entityId}`,
        type,
        entityId,
        label,
      };

      return {
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
      };
    });
  },

  closeTab: (id) => {
    set((state) => {
      const newTabs = state.tabs.filter((tab) => tab.id !== id);
      let newActiveTabId = state.activeTabId;

      // If we're closing the active tab, set a new active tab
      if (state.activeTabId === id) {
        if (newTabs.length > 0) {
          // Find the tab that was before the closed tab
          const closedIndex = state.tabs.findIndex((tab) => tab.id === id);
          const newIndex = Math.max(0, closedIndex - 1);
          newActiveTabId = newTabs[newIndex]?.id || null;
        } else {
          newActiveTabId = null;
        }
      }

      return {
        tabs: newTabs,
        activeTabId: newActiveTabId,
      };
    });
  },

  closeOtherTabs: (id) => {
    set((state) => {
      const tabToKeep = state.tabs.find((tab) => tab.id === id);
      if (!tabToKeep) return state;

      return {
        tabs: [tabToKeep],
        activeTabId: id,
      };
    });
  },

  closeTabsToRight: (id) => {
    set((state) => {
      const tabIndex = state.tabs.findIndex((tab) => tab.id === id);
      if (tabIndex === -1) return state;

      const newTabs = state.tabs.slice(0, tabIndex + 1);
      const newActiveTabId = newTabs.find((tab) => tab.id === state.activeTabId)
        ? state.activeTabId
        : newTabs[newTabs.length - 1]?.id || null;

      return {
        tabs: newTabs,
        activeTabId: newActiveTabId,
      };
    });
  },

  closeAllTabs: () => {
    set({
      tabs: [],
      activeTabId: null,
    });
  },

  setActiveTab: (id) => {
    set({ activeTabId: id });
  },
}));
