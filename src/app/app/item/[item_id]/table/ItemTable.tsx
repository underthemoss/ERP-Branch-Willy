"use client";
import "./table.css";
import { useItem } from "../ItemProvider";
import {
  Box,
  Card,
  Dropdown,
  ListDivider,
  ListItemDecorator,
  Menu,
  MenuButton,
  MenuItem,
  Typography,
} from "@mui/joy";
import AddIcon from "@mui/icons-material/Add";
import Check from "@mui/icons-material/Check";
import { VirtualAsyncTable } from "../../../../../ui/VirtualAsyncTable";
import { MenuItemLink } from "@/ui/MenuItemLink";
import { updateToggleSelectedColumns } from "../actions";
import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";
import { TableFooter } from "./TableFooter";
import { Tiles } from "./Tiles";

export const ItemTable = () => {
  const { item, loadMore } = useItem();

  const rowHeight = 50;
  return (
    <Box flex={1} display={"flex"} flexDirection={"column"}>
      <Box p={2} display={"flex"}>
        <Typography level="h1" fontWeight={500}>
          {item.name}
        </Typography>
        <Box flex={1}></Box>
      </Box>
      <Box display={"flex"} height={300}>
        <Tiles />
      </Box>
      <Box>
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
      <Box flex={1} display={"flex"} p={1}>
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
            rowHeight={rowHeight}
            headerHeight={60}
            footerHeight={60}
            resolveRows={loadMore}
            renderHeader={TableHeader}
            renderRow={TableRow}
            renderFooter={TableFooter}
          />
        </Card>
      </Box>
    </Box>
  );
};
