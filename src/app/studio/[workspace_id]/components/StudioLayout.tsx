"use client";

import { Box } from "@mui/material";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { FileExplorer } from "./FileExplorer/FileExplorer";
import { ContentArea } from "./ContentArea/ContentArea";
import { AgentPanel } from "./AgentPanel/AgentPlaceholder";

interface StudioLayoutProps {
  workspaceId: string;
}

export function StudioLayout({ workspaceId }: StudioLayoutProps) {
  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
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
          onMouseEnter={(e: any) => {
            e.target.style.background = "#007ACC";
            e.target.style.width = "2px";
          }}
          onMouseLeave={(e: any) => {
            e.target.style.background = "#E5E5E5";
            e.target.style.width = "1px";
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
          onMouseEnter={(e: any) => {
            e.target.style.background = "#007ACC";
            e.target.style.width = "2px";
          }}
          onMouseLeave={(e: any) => {
            e.target.style.background = "#E5E5E5";
            e.target.style.width = "1px";
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
            <AgentPanel />
          </Box>
        </Panel>
      </PanelGroup>
    </Box>
  );
}
