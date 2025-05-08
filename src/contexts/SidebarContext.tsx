import React, { createContext, ReactNode, useContext, useState } from "react";

interface SidebarContextType {
  isSidebarOpen: boolean;
  sidebarContent: ReactNode | null;
  openSidebar: (content: ReactNode) => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarContent, setSidebarContent] = useState<ReactNode | null>(null);

  const openSidebar = (newContent: ReactNode) => {
    setSidebarContent(newContent);
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setSidebarContent(null);
  };

  const toggleSidebar = (newContent?: ReactNode) => {
    setIsSidebarOpen(!isSidebarOpen);
    if (newContent) {
      setSidebarContent(null);
    }
  };

  return (
    <SidebarContext.Provider
      value={{ isSidebarOpen, sidebarContent, openSidebar, closeSidebar, toggleSidebar }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};
