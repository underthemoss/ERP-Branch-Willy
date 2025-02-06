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
  const { item } = useItem();
  const row = item.rows[index];
  if (!row) {
    return (
      <Box flex={1} width={width} sx={{ backgroundColor: "white" }}>
        LOADING
      </Box>
    );
  }
  const firstColumnIndent = 50;

  return (
    <Box
      key={index}
      flex={1}
      display={"flex"}
      width={width}
      // borderBottom={"1px solid #e0e1e3"}
    >
      <Box
        width={firstColumnIndent}
        position={"sticky"}
        left={0}
        alignContent={"center"}
      >
        <Box display={"flex"} justifySelf={"center"}>
          <NextLink href={`/app/item/${row.id}`}>
            <EntityTypeIcon entityTypeIcon={row.type_id as any} />
          </NextLink>
        </Box>
      </Box>

      {item.column_config.map((column, colIndex, all) => {
        const value = row.values[colIndex];

        const indent = colIndex === 0 ? firstColumnIndent : 0;
        const left =
          item.column_config
            .slice(0, colIndex)
            .reduce((acc, { width }) => acc + width, 0) + indent;
        const width = Math.max(column.width - indent, 0);

        return (
          <Box
            key={column.key}
            width={width}
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
            {
              <CellRender
                // key={value}
                type={column.type}
                colIndex={colIndex}
                rowIndex={index}
                totalColumns={item.column_config.length}
                value={value}
                columnLookupConfig={item.column_config[colIndex].lookup} // todo: dont need this?
                readonly={column.readonly}
                onBlur={async (value) => {
                  // await updateItemValue({
                  //   columnIndex: colIndex,
                  //   item_id: row.id,
                  //   value: value || null,
                  // });
                }}
              ></CellRender>
            }
          </Box>
        );
      })}
    </Box>
  );
};
