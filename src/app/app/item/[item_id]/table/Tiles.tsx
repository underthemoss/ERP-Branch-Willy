"use client";

import "../../../../../../node_modules/react-grid-layout/css/styles.css";
import "../../../../../../node_modules/react-resizable/css/styles.css";
import {
  Box,
  BoxProps,
  Card,
  Dropdown,
  ListDivider,
  ListItemDecorator,
  Menu,
  MenuButton,
  MenuItem,
  Switch,
} from "@mui/joy";
import ReactGridLayout, { Layout, WidthProvider } from "react-grid-layout";
import { useItem } from "../ItemProvider";
import { EntityCard } from "@/ui/entity-card/EntityCard";
import { VirtualAsyncTable } from "@/ui/VirtualAsyncTable";
import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";
import { TableFooter } from "./TableFooter";
import React, { useState } from "react";
import Check from "@mui/icons-material/Check";
import AddIcon from "@mui/icons-material/Add";
import { MenuItemLink } from "@/ui/MenuItemLink";

export const Tiles: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => {
  const { item, loadMore } = useItem();
  const [editMode, setEditMode] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);

  const tileProps: BoxProps = editMode
    ? {
        display: "flex",
        sx: {
          userSelect: "none",
          cursor: isResizing ? "move" : "grab",
          "&  .react-grid-item": { pointerEvents: "none" },
        },
      }
    : { display: "flex" };

  const gap = 8;
  const gridSize = 12;
  const adjustedHeight = height - gap - gap * gridSize;
  const rowIncrements = adjustedHeight / gridSize;

  const layout: Layout[] = [
    {
      w: 2,
      h: 4,
      x: 0,
      y: 0,
      i: "entity-card",
      maxW: 12,
      maxH: 12,
      moved: false,
      static: false,
      isBounded: true,
    },
    {
      w: 12,
      h: 8,
      x: 0,
      y: 4,
      i: "table",
      maxW: 12,
      maxH: 12,
      moved: false,
      static: false,
      isBounded: true,
    },
    {
      w: 1,
      h: 1,
      x: 11,
      y: 0,
      i: "menu",
      maxW: 12,
      maxH: 12,
      moved: false,
      static: false,
      isBounded: true,
    },
  ];

  return (
    <Box>
      <Box position={"absolute"} top={14} right={120} zIndex={9999}>
        <Switch
          checked={editMode}
          onChange={(e) => setEditMode(e.target.checked)}
        ></Switch>
      </Box>
      <ReactGridLayout
        isDraggable={editMode}
        isResizable={editMode}
        layout={layout}
        compactType={"vertical"}
        rowHeight={rowIncrements}
        width={width}
        cols={gridSize}
        maxRows={gridSize}
        onResizeStart={(_, __, { i }) => {
          setIsResizing(i);
        }}
        onResizeStop={() => setIsResizing(null)}
        onLayoutChange={(e) => {
          console.log(e);
        }}
        margin={[gap, gap]}
      >
        <Box key={"entity-card"} {...tileProps}>
          <EntityCard item_id={item.id} />
        </Box>
        <Box key={"table"} {...tileProps}>
          {isResizing !== "table" && (
            <Card
              sx={{
                flex: 1,
                padding: 0,
                backgroundColor: "white",
                overflow: "hidden",
              }}
              variant="outlined"
            >
              <VirtualAsyncTable
                items={item.rows}
                totalRows={item.count}
                rowHeight={50}
                headerHeight={60}
                footerHeight={60}
                resolveRows={loadMore}
                renderHeader={TableHeader}
                renderRow={TableRow}
                renderFooter={TableFooter}
              />
            </Card>
          )}
        </Box>
        <Box key={"menu"} {...tileProps}>
          <Dropdown open={undefined}>
            <MenuButton
              size="sm"
              variant="plain"
              startDecorator={<AddIcon />}
            ></MenuButton>

            <Menu placement="bottom-start" sx={{ minWidth: 150 }}>
              {item.column_config.map((col) => {
                return (
                  <MenuItem
                    key={col.key}
                    onClick={async () => {
                      // await updateToggleSelectedColumns(item.id, columnId);
                    }}
                  >
                    <ListItemDecorator>
                      {!col.hidden && <Check />}
                    </ListItemDecorator>
                    {col.label}
                  </MenuItem>
                );
              })}{" "}
              <ListDivider />
              <MenuItemLink href={`/app/item/${item.id}/add-column`}>
                <>Add new column</>
              </MenuItemLink>{" "}
            </Menu>
          </Dropdown>
        </Box>
      </ReactGridLayout>
    </Box>
  );
};
