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
import { QueryTableHeaderCell } from "./QueryTableHeaderCell";
import { MenuItemLink } from "@/ui/MenuItemLink";
import { NextLink } from "@/ui/NextLink";
import { QueryTableRowCellRender } from "./QueryTableRowCellRender";

import { EntityTypeIcon } from "@/ui/EntityTypeIcons";
import { Fragment, useEffect, useRef, useState } from "react";
import GridLayout from "react-grid-layout";
import _ from "lodash";
import { ContentTypeAttributeType } from "../../../../../../prisma/generated/mongo";
import { useTable } from "./QueryTableProvider";

export const QueryTableHeader: React.FC<{
  headerHeight: number;
  width: number;
}> = ({ headerHeight, width }) => {
  const { columns } = useTable();

  const actualWidth = Math.max(width);
  const tableColumnMaxWidth = 600;
  const tableMaxColumns = columns.length * tableColumnMaxWidth;
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
          // const newColumnOrderKeys = _.sortBy(newLayout, (d) => d.x).map(
          //   (c) => c.i
          // );
          // const oldColumnOrderKeys = item.column_config.map((c) => c.key);
          // if (!_.isEqual(newColumnOrderKeys, oldColumnOrderKeys)) {
          //   updateColumnOrder({ columnKeys: newColumnOrderKeys });
          // }
          // const newColumnWidths = _.sortBy(newLayout, (d) => d.x).map((c) =>
          //   Math.min(c.w, tableColumnMaxWidth)
          // );
          // const oldColumnWidths = item.column_config.map((c) => c.width);
          // if (!_.isEqual(newColumnWidths, oldColumnWidths)) {
          //   updateColumnWidths({ widths: newColumnWidths });
          // }
        }}
        containerPadding={[0, 0]}
        margin={[0, 0]}
        draggableHandle=".column-drag-handle"
      >
        {columns.map((column, index) => {
          // const isLastColumn = item.column_config.length === index + 1;
          return (
            <Box
              key={column.key}
              data-grid={{
                x: index + 100,
                y: 0,
                w: 200,
                h: 1,
                static: false,
                maxW: tableColumnMaxWidth,
                isResizable: true,
                isDraggable: true,

                resizeHandles: ["e"],
              }}
              display={"flex"}
            >
              <QueryTableHeaderCell index={index} />
            </Box>
          );
        })}
      </GridLayout>
    </Box>
  );
};
