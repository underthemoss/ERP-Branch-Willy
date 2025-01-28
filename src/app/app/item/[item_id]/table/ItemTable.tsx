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
import { VirtualAsyncTable } from "./VirtualAsyncTable";
import { ColumnHeader } from "./ColumnHeader";
import { MenuItemLink } from "@/ui/MenuItemLink";
import { NextLink } from "@/ui/NextLink";
import { CellRender } from "./CellRender";
import { addRow, deleteItem, updateToggleSelectedColumns } from "../actions";
import { EntityTypeIcon } from "@/ui/EntityTypeIcons";

export const ItemTable = () => {
  const { item, loadMore, updateItemValue } = useItem();

  const firstColumnWidth = 50;
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
          renderHeader={() => {
            return (
              <Box
                flex={1}
                display={"flex"}
                // width={"1000%"}
                style={{
                  borderBottom: "2px solid rgb(221 223 226)",
                  borderTop: "1px solid rgb(222, 222, 222)",
                  backgroundColor: "#fbfcfe",
                }}
              >
                <Box
                  position={"sticky"}
                  left={0}
                  style={{
                    width: firstColumnWidth,
                    zIndex: 9999,
                    backgroundColor: "#fbfcfe",
                    borderRight: "1px solid rgb(222, 222, 222)",
                  }}
                ></Box>
                {item.columns.map((c, i) => {
                  if (!c.column_type) return <>col not found</>;
                  return (
                    <ColumnHeader
                      key={c.id}
                      type={c.column_type.type}
                      index={i}
                      label={c.column_type.label}
                      width={c.column_width || 120}
                      objectId={c.id}
                      lookupId={(c.column_type.data as any).lookup}
                    />
                  );
                })}

                <Box
                  position={"sticky"}
                  right={0}
                  width={lastColumnWidth}
                  style={{ backgroundColor: "#fbfcfe", zIndex: 9999 }}
                  alignContent={"center"}
                >
                  <Dropdown open={undefined}>
                    <MenuButton
                      size="sm"
                      variant="plain"
                      startDecorator={<AddIcon />}
                    >
                      
                    </MenuButton>

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
                              await updateToggleSelectedColumns(
                                item.id,
                                columnId
                              );
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
              </Box>
            );
          }}
          renderRow={(row, rowIndex) => {
            if (!row) {
              return <Box>LOADING</Box>;
            }
            return (
              <Box flex={1} display={"flex"} borderBottom={"1px solid #e0e1e3"}>
                <Box
                  width={firstColumnWidth}
                  position={"sticky"}
                  left={0}
                  style={{
                    backgroundColor: "#fbfcfe",
                    borderRight: "1px solid rgb(222, 222, 222)",
                  }}
                  alignContent={"center"}
                >
                  <Box display={"flex"} justifySelf={"center"}>
                    <NextLink href={`/app/item/${row.id}`}>
                      <EntityTypeIcon entityTypeIcon={"document"} />
                      {/* {rowIndex} */}
                      {/* {item.id} */}
                    </NextLink>
                  </Box>
                </Box>

                {item.columns.map((column, colIndex) => {
                  const value = row.values[colIndex];
                  return (
                    <Box
                      key={column.id}
                      width={column.column_width || 120}
                      alignContent={"center"}
                      //   display={"flex"}
                    >
                      {column.column_type && (
                        <CellRender
                          // key={value}
                          type={column.column_type.type}
                          colIndex={colIndex}
                          rowIndex={rowIndex}
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
                  width={lastColumnWidth}
                  position={"sticky"}
                  alignContent={"center"}
                  right={0}
                  style={{ backgroundColor: "#fbfcfe" }}
                >
                  <Tooltip
                    enterDelay={300}
                    title="Delete"
                    placement="bottom"
                    arrow
                  >
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
                </Box>
              </Box>
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
  );
};
