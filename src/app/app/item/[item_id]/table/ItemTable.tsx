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
import {
  addRow,
  deleteItem,
  toggleSelectedColumns,
  updateCell,
} from "../actions";

export const ItemTable = () => {
  const {
    item,
    columns,
    displayColumns,
    totalChildren,
    resolveChildren,
    loadedChildren,
  } = useItem();

  const firstColumnWidth = 260;
  const lastColumnWidth = 200;

  return (
    <Box flex={1} display={"flex"} flexDirection={"column"}>
      <Box p={2} display={"flex"}>
        <Typography level="h1" fontWeight={500}>
          {(item.data as any)?.name}
        </Typography>
        <Box flex={1}></Box>
      </Box>

      <Box flex={1} display={"flex"}>
        <VirtualAsyncTable
          items={loadedChildren}
          rowHeight={50}
          headerHeight={60}
          footerHeight={40}
          resolveRows={async ({ skip, take }) => {
            await resolveChildren({
              item_id: item.id,
              skip,
              take,
              order_by: "equipment_category",
            });
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
                {displayColumns.map((c, i) => {
                  if (!c.column_type) return <>col not found</>;
                  return (
                    <ColumnHeader
                      key={c.id}
                      type={c.column_type.type}
                      index={i}
                      label={c.name || c.column_type.label}
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
                      Columns
                    </MenuButton>

                    <Menu placement="bottom-start" sx={{ minWidth: 150 }}>
                      <MenuItemLink href={`/app/item/${item.id}/add-column`}>
                        <>Create new column</>
                      </MenuItemLink>

                      <ListDivider />
                      {columns.map((col) => {
                        const isSelected = displayColumns.some(
                          (c) => col.id === c.column_id
                        );
                        const columnId = col.id;

                        return (
                          <MenuItem
                            key={col.id}
                            onClick={async () => {
                              await toggleSelectedColumns(item.id, columnId);
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
          renderRow={(item, rowIndex) => {
            if (!item) {
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
                    <NextLink href={`/app/item/${item.id}`}>
                      {/* <EntityTypeIcon entityTypeIcon={item.type.icon} />  */}
                      {rowIndex} {item.type_id}
                      {/* {item.id} */}
                    </NextLink>
                  </Box>
                </Box>

                {displayColumns.map((c, colIndex) => {
                  const value = (item.data as any)[c.column_id];

                  return (
                    <Box
                      key={c.id}
                      width={c.column_width || 120}
                      alignContent={"center"}
                      //   display={"flex"}
                    >
                      {c.column_type && (
                        <CellRender
                          key={value}
                          type={c.column_type.type}
                          colIndex={colIndex}
                          rowIndex={rowIndex}
                          totalColumns={displayColumns.length}
                          value={value}
                          columnData={c.column_type.data as any}
                          readonly={c.column_type.readonly}
                          onBlur={async (value) => {
                            await updateCell(item.id, c.column_id, value);
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
                        await deleteItem(item.id);
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
                      <Box>Total: {totalChildren}</Box>
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
