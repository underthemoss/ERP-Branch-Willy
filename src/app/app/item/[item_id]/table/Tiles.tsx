"use client";

import "../../../../../../node_modules/react-grid-layout/css/styles.css";
import "../../../../../../node_modules/react-resizable/css/styles.css";
import { Box, Card } from "@mui/joy";
import ReactGridLayout, { Layout, WidthProvider } from "react-grid-layout";
import { useItem } from "../ItemProvider";

export const Tiles = () => {
  const { item } = useItem();

  const tiles: ({ url: string } & Layout)[] = [
    {
      i: "map",
      x: 0,
      y: 0,
      w: 3,
      h: 10,
      maxH: 10,
      maxW: 12,
      minW: 1,
      minH: 1,
      isResizable: true,
      isDraggable: true,
      resizeHandles: ["se"],
      url: "/es-erp/tiles/map",
    },
    {
      i: "map2",
      x: 1,
      y: 0,
      w: 3,
      h: 10,
      maxH: 10,
      maxW: 12,
      minW: 1,
      minH: 1,
      isResizable: true,
      isDraggable: true,
      resizeHandles: ["se"],
      url: `/es-erp/app/item/${item.id}/new/system_folder`,
    },
  ];
  return (
    <Box>
      <ReactGridLayout
        compactType={"horizontal"}
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
            <Box
              key={t.i}
              data-grid={{
                ...t,
              }}
              display={"flex"}
            >
              <Card sx={{ padding: 0, flex: 1, m: 1, overflow: "hidden" }}>
                <Box>asd</Box>
                <iframe
                  style={{ width: "100%", height: "100%", border: "0px" }}
                  src={url}
                ></iframe>
              </Card>
            </Box>
          );
        })}
      </ReactGridLayout>
    </Box>
  );
};
