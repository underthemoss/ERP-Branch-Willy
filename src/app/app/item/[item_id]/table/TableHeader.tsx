"use client";
import "../../../../../../node_modules/react-grid-layout/css/styles.css";
import "../../../../../../node_modules/react-resizable/css/styles.css";
import { useItem } from "../ItemProvider";
import {
  Box,
  Button,
  Dropdown,
  ListDivider,
  ListItemDecorator,
  Menu,
  MenuButton,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/joy";
import AddIcon from "@mui/icons-material/Add";
import Check from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import { VirtualAsyncTable } from "../../../../../ui/VirtualAsyncTable";
import { TableHeaderCell } from "./TableHeaderCell";
import { MenuItemLink } from "@/ui/MenuItemLink";
import { NextLink } from "@/ui/NextLink";
import { CellRender } from "./CellRender";
import { addRow, deleteItem, updateToggleSelectedColumns } from "../actions";
import { EntityTypeIcon } from "@/ui/EntityTypeIcons";
import { Fragment, useEffect, useRef, useState } from "react";
import GridLayout from "react-grid-layout";
import _ from "lodash";

export const TableHeader: React.FC<{ headerHeight: number; width: number }> = ({
  headerHeight,
  width,
}) => {
  const { item, updateColumnOrder, updateColumnWidths } = useItem();

  const actualWidth = Math.max(
    item.column_config.reduce((t, i) => t + i.width, 0),
    width
  );
  const tableColumnMaxWidth = 600;
  const tableMaxColumns = item.column_config.length * tableColumnMaxWidth;
  return (
    <Box sx={{ backgroundColor: "white", width: actualWidth }}>
      <GridLayout
        //   layout={adjustedLayout}
        cols={tableMaxColumns}
        width={tableMaxColumns}
        maxRows={1}
        isResizable
        rowHeight={headerHeight}
        useCSSTransforms
        compactType={"horizontal"}
        // onDrop={(e, item) => console.log(e, item)}
        onLayoutChange={(newLayout) => {
          const newColumnOrderKeys = _.sortBy(newLayout, (d) => d.x).map(
            (c) => c.i
          );
          const oldColumnOrderKeys = item.column_config.map((c) => c.key);

          if (!_.isEqual(newColumnOrderKeys, oldColumnOrderKeys)) {
            updateColumnOrder({ columnKeys: newColumnOrderKeys });
          }
          const newColumnWidths = _.sortBy(newLayout, (d) => d.x).map((c) =>
            Math.min(c.w, tableColumnMaxWidth)
          );
          const oldColumnWidths = item.column_config.map((c) => c.width);
          if (!_.isEqual(newColumnWidths, oldColumnWidths)) {
            updateColumnWidths({ widths: newColumnWidths });
          }
        }}
        containerPadding={[0, 0]}
        margin={[0, 0]}
        draggableHandle=".column-drag-handle"
      >
        {item.column_config.map((c, index) => {
          return (
            <Box
              key={c.key}
              data-grid={{
                x: index + 100,
                y: 0,
                w: c.width,
                h: 1,
                static: false,
                maxW: tableColumnMaxWidth,
                isResizable: true,
                isDraggable: true,

                resizeHandles: ["e"],
              }}
              display={"flex"}
            >
              <TableHeaderCell index={index} />
            </Box>
          );
        })}
      </GridLayout>
    </Box>
  );
};
