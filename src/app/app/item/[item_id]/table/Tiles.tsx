"use client";

import "../../../../../../node_modules/react-grid-layout/css/styles.css";
import "../../../../../../node_modules/react-resizable/css/styles.css";
import { Box, Card } from "@mui/joy";
import ReactGridLayout, { Layout, WidthProvider } from "react-grid-layout";

const ResponsiveGridLayout = WidthProvider(ReactGridLayout);

export const Tiles = () => {
  const tiles: ({ url: string } & Layout)[] = [
    {
      i: "map",
      x: 0,
      y: 0,
      w: 3,
      h: 3,
      maxH: 10,
      maxW: 12,
      minW: 1,
      minH: 1,
      isResizable: true,
      isDraggable: true,
      resizeHandles: ["se"],
      url: "/resource-planning/tiles/map",
    },
  ];
  return (
    <Box>
      <ReactGridLayout
        rowHeight={30}
        maxRows={10}
        width={1000}
        cols={12}
        isResizable
        containerPadding={[8, 8]}
        margin={[0, 0]}
      >
        {tiles.map(({ url, ...t }) => {
          return (
            <Card
              key={t.i}
              sx={{ padding: 0 }}
              data-grid={{
                ...t,
              }}
            >
              <iframe
                style={{ width: "100%", height: "100%", border: "0px" }}
                src={url}
              ></iframe>
            </Card>
          );
        })}
      </ReactGridLayout>
    </Box>
  );
};
