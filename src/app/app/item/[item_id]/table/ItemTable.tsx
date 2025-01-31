"use client";
import "./table.css";
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
import { VirtualAsyncTable } from "./VirtualAsyncTable";

import { MenuItemLink } from "@/ui/MenuItemLink";
import { NextLink } from "@/ui/NextLink";
import { CellRender } from "./CellRender";
import { addRow, deleteItem, updateToggleSelectedColumns } from "../actions";
import { EntityTypeIcon } from "@/ui/EntityTypeIcons";
import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";

export const ItemTable = () => {
  const { item, loadMore, updateItemValue } = useItem();

  const firstColumnWidth = 0;
  const lastColumnWidth = 60;
  const rowHeight = 50;
  return (
    <Box flex={1} display={"flex"} flexDirection={"column"}>
      <Box p={2} display={"flex"}>
        <Typography level="h1" fontWeight={500}>
          {item.name}
        </Typography>
        <Box flex={1}></Box>
      </Box>
      <Box>
        {" "}
        <Dropdown open={undefined}>
          <MenuButton
            size="sm"
            variant="plain"
            startDecorator={<AddIcon />}
          ></MenuButton>

          <Menu placement="bottom-start" sx={{ minWidth: 150 }}>
            <MenuItemLink href={`/app/item/${item.id}/add-column`}>
              <>Create new column</>
            </MenuItemLink>

            <ListDivider />
            {item.all_columns.map((col) => {
              const isSelected = item.columns.some(
                (c) => c.column_id === col.id
              );
              const columnId = col.id;

              return (
                <MenuItem
                  key={col.id}
                  onClick={async () => {
                    await updateToggleSelectedColumns(item.id, columnId);
                  }}
                >
                  <ListItemDecorator>
                    {isSelected && <Check />}
                  </ListItemDecorator>
                  {col.label}
                </MenuItem>
              );
            })}
          </Menu>
        </Dropdown>
      </Box>
      <Box flex={1} display={"flex"}>
        <Box flex={1} display={"flex"}>
          <VirtualAsyncTable
            items={item.rows}
            totalRows={item.count}
            rowHeight={rowHeight}
            headerHeight={60}
            footerHeight={40}
            resolveRows={async ({ skip, take }) => {
              loadMore({ skip, take });
            }}
            renderHeader={({ headerHeight }) => {
              return <TableHeader headerHeight={headerHeight} />;
            }}
            renderRow={({ item: row, index: index, width, rowHeight }) => {
              return (
                <TableRow
                  rowHeight={rowHeight}
                  item={row}
                  index={index}
                  width={width}
                />
              );
            }}
            renderFooter={() => {
              return (
                <Box
                  flex={1}
                  display={"flex"}
                  style={{ backgroundColor: "white", zIndex: 9999 }}
                >
                  <Box position={"sticky"} left={0}>
                    <Box display={"flex"}>
                      <Box>
                        <Button
                          variant="plain"
                          onClick={async () => {
                            await addRow(item.id);
                          }}
                        >
                          New row
                        </Button>
                      </Box>
                      <Box flex={1}></Box>
                      <Box>
                        <Box>Total: {item.count}</Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};
