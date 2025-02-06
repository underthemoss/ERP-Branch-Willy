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
  Skeleton,
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

      <Box display={"flex"}>
        <Box flex={1}></Box>
        <Box>
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
          </Dropdown>{" "}
        </Box>
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
