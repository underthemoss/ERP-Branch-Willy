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
    item.columns.reduce((t, i) => t + i.column_width, 0),
    width
  );
  const tableColumnMaxWidth = 600;
  const tableMaxColumns = item.columns.length * tableColumnMaxWidth;
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
          const newColumnOrderIds = _.sortBy(newLayout, (d) => d.x).map(
            (c) => c.i
          );
          const oldColumnOrderIds = item.columns.map((c) => c.id);
          if (!_.isEqual(newColumnOrderIds, oldColumnOrderIds)) {
            updateColumnOrder({ columnIds: newColumnOrderIds });
          }
          const newColumnWidths = _.sortBy(newLayout, (d) => d.x).map(
            (c) => c.w
          );
          const oldColumnWidths = item.columns.map((c) => c.column_width);
          if (!_.isEqual(newColumnWidths, oldColumnWidths)) {
            updateColumnWidths({ widths: newColumnWidths });
          }
        }}
        containerPadding={[0, 0]}
        margin={[0, 0]}
        draggableHandle=".column-drag-handle"
      >
        {item.columns.map((c, index) => {
          return (
            <Box
              key={c.id}
              data-grid={{
                x: index + 100,
                y: 0,
                w: c.column_width,
                h: 1,
                static: false,
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
