"use client";
import "./QueryTable.css";
import {
  Box,
  Dropdown,
  ListDivider,
  ListItemDecorator,
  Menu,
  MenuButton,
  MenuItem,
} from "@mui/joy";
import AddIcon from "@mui/icons-material/Add";

import { VirtualAsyncTable } from "../../../../../ui/VirtualAsyncTable";

import { QueryTableHeader } from "./QueryTableHeader";
import { QueryTableRow } from "./QueryTableRow";
import { QueryTableFooter } from "./QueryTableFooter";

import AutoSizer from "react-virtualized-auto-sizer";
import { Query } from "../actions";
import { QueryTableProvider, useTable } from "./QueryTableProvider";

const QueryTableRenderer = () => {
  const { query, rows } = useTable();

  return (
    <AutoSizer>
      {({ height, width }) => {
        return (
          <Box width={width} height={height} display={"flex"}>
            <VirtualAsyncTable
              items={rows}
              totalRows={rows.length}
              rowHeight={50}
              headerHeight={60}
              footerHeight={60}
              resolveRows={async () => {}}
              renderHeader={QueryTableHeader}
              renderRow={QueryTableRow}
              renderFooter={QueryTableFooter}
            />
            <Box pt={3} width={3}>
              <Box ml={-5}>
                <Dropdown open={undefined}>
                  <MenuButton
                    size="sm"
                    variant="plain"
                    startDecorator={<AddIcon />}
                  ></MenuButton>

                  <Menu placement="left-start" sx={{ minWidth: 150 }}>
                    {Object.values({}).map((col: any) => {
                      return (
                        <MenuItem
                          key={col.key}
                          onClick={async () => {
                            // await updateToggleSelectedColumns(item.id, columnId);
                          }}
                        >
                          <ListItemDecorator>
                            {/* {!col.hidden && <Check />} */}
                          </ListItemDecorator>
                          {col.label}
                        </MenuItem>
                      );
                    })}
                    <ListDivider />
                    {/* <MenuItemLink href={`/app/item/${item.id}/add-column`}>
                      <>Add new column</>
                    </MenuItemLink>{" "} */}
                  </Menu>
                </Dropdown>
              </Box>
            </Box>
          </Box>
        );
      }}
    </AutoSizer>
  );
};

export const QueryTable: React.FC<{ query: Query }> = ({ query }) => {
  return (
    <QueryTableProvider key={Date.now()} query={query}>
      <QueryTableRenderer />
    </QueryTableProvider>
  );
};
