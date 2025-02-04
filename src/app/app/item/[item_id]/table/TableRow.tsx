"use client";
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
// import { minimumColWidth } from "./TableHeaderCell";
import { MenuItemLink } from "@/ui/MenuItemLink";
import { NextLink } from "@/ui/NextLink";
import { CellRender } from "./CellRender";
import { addRow, deleteItem, updateToggleSelectedColumns } from "../actions";
import { EntityTypeIcon } from "@/ui/EntityTypeIcons";
import { TableHeader } from "./TableHeader";

export const TableRow: React.FC<{
  width: number;
  index: number;
  rowHeight: number;
}> = ({ index: index, width, rowHeight }) => {
  const { item, updateItemValue } = useItem();
  const row = item.rows[index];
  if (!row) {
    return (
      <Box flex={1} width={width} sx={{ backgroundColor: "white" }}>
        LOADING
      </Box>
    );
  }

  return (
    <Box
      key={index}
      flex={1}
      display={"flex"}
      width={width}
      // borderBottom={"1px solid #e0e1e3"}
    >
      {/* <Box
        width={firstColumnWidth}
        position={"sticky"}
        left={0}
        style={
          {
            // backgroundColor: "#fbfcfe",
            // borderRight: "1px solid rgb(222, 222, 222)",
          }
        }
        alignContent={"center"}
      >
        <Box display={"flex"} justifySelf={"center"}>
          <NextLink href={`/app/item/${row.id}`}>
            <EntityTypeIcon entityTypeIcon={"document"} />

          </NextLink>
        </Box>
      </Box> */}

      {item.columns.map((column, colIndex, all) => {
        const value = row.values[colIndex];
        const left = item.columns
          .slice(0, colIndex)
          .reduce((acc, { column_width }) => acc + column_width, 0);
        return (
          <Box
            key={column.id}
            width={column.column_width}
            alignContent={"center"}
            className={`col-${colIndex} row-${index}`}
            sx={{
              transition: "left 0.3s ease-in-out",
              position: "absolute",
              left: left,
              height: rowHeight,
              backgroundColor: "white",
            }}
            //   display={"flex"}
          >
            {column.column_type && (
              <CellRender
                // key={value}
                type={column.column_type.type}
                colIndex={colIndex}
                rowIndex={index}
                totalColumns={item.columns.length}
                value={value}
                columnData={column.column_type.data as any}
                readonly={column.column_type.readonly}
                onBlur={async (value) => {
                  await updateItemValue({
                    columnIndex: colIndex,
                    item_id: row.id,
                    value: value || null,
                  });
                }}
              ></CellRender>
            )}
          </Box>
        );
      })}

      <Box></Box>
      <Box
        position={"absolute"}
        alignContent={"center"}
        right={0}
        style={{ backgroundColor: "#fbfcfe" }}
      >
        <NextLink href={`/app/item/${row.id}`}>Go</NextLink>
      </Box>
      {/* <Box
        // width={lastColumnWidth}
        position={"absolute"}
        alignContent={"center"}
        right={0}
        style={{ backgroundColor: "#fbfcfe" }}
      >
        <Tooltip enterDelay={300} title="Delete" placement="bottom" arrow>
          <Button
            tabIndex={-1}
            variant="plain"
            onClick={async () => {
              await deleteItem(row.id);
            }}
          >
            <DeleteIcon color="action" />
          </Button>
        </Tooltip>
      </Box> */}
    </Box>
  );
};
