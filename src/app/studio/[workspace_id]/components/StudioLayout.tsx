"use client";

import { Box } from "@mui/material";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { AgentPanel } from "./AgentV3/AgentPanel";
import { ContentArea } from "./ContentArea/ContentArea";
import { FileExplorer } from "./FileExplorer/FileExplorer";

interface StudioLayoutProps {
  workspaceId: string;
}

export function StudioLayout({ workspaceId }: StudioLayoutProps) {
  return (
    <Box
      sx={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "#FFFFFF",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
        fontSize: "13px",
        // VS Code thin scrollbars
        "& *::-webkit-scrollbar": {
          width: "10px",
          height: "10px",
        },
        "& *::-webkit-scrollbar-track": {
          background: "transparent",
        },
        "& *::-webkit-scrollbar-thumb": {
          background: "#CCCCCC",
          borderRadius: "10px",
          border: "3px solid transparent",
          backgroundClip: "content-box",
        },
        "& *::-webkit-scrollbar-thumb:hover": {
          background: "#B3B3B3",
          borderRadius: "10px",
          border: "3px solid transparent",
          backgroundClip: "content-box",
        },
      }}
    >
      <PanelGroup direction="horizontal">
        {/* File Explorer Panel */}
        <Panel defaultSize={20} minSize={15} maxSize={35} id="file-explorer">
          <Box
            sx={{
              height: "100%",
              bgcolor: "#F3F3F3",
              borderRight: "1px solid #E5E5E5",
              overflow: "hidden",
            }}
          >
            <FileExplorer workspaceId={workspaceId} />
          </Box>
        </Panel>

        <PanelResizeHandle
          style={{
            width: "1px",
            background: "#E5E5E5",
            cursor: "col-resize",
            transition: "background 150ms ease",
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLElement;
            target.style.background = "#007ACC";
            target.style.width = "2px";
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLElement;
            target.style.background = "#E5E5E5";
            target.style.width = "1px";
          }}
        />

        {/* Content Area Panel */}
        <Panel defaultSize={55} minSize={30} id="content-area">
          <Box
            sx={{
              height: "100%",
              bgcolor: "#FFFFFF",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <ContentArea />
          </Box>
        </Panel>

        <PanelResizeHandle
          style={{
            width: "1px",
            background: "#E5E5E5",
            cursor: "col-resize",
            transition: "background 150ms ease",
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLElement;
            target.style.background = "#007ACC";
            target.style.width = "2px";
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLElement;
            target.style.background = "#E5E5E5";
            target.style.width = "1px";
          }}
        />

        {/* Agent Panel */}
        <Panel defaultSize={25} minSize={20} maxSize={40} id="agent-panel">
          <Box
            sx={{
              height: "100%",
              bgcolor: "#F3F3F3",
              borderLeft: "1px solid #E5E5E5",
              overflow: "hidden",
            }}
          >
            <AgentPanel workspaceId={workspaceId} />
          </Box>
        </Panel>
      </PanelGroup>
    </Box>
  );
}
