"use client";
import { Box } from "@mui/joy";
import AutoSizer from "react-virtualized-auto-sizer";

export const FixedSizeScroller: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  return (
    <AutoSizer>
      {({ width, height }) => (
        <Box width={width} height={height} overflow={"scroll"}>
          {children}
        </Box>
      )}
    </AutoSizer>
  );
};
