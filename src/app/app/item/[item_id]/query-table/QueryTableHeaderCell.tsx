"use client";
import {
  Box,
  Dropdown,
  IconButton,
  ListDivider,
  ListItemDecorator,
  Menu,
  MenuButton,
  MenuItem,
  Typography,
} from "@mui/joy";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { useState } from "react";
import { NextLink } from "@/ui/NextLink";

import { useItem } from "../ItemProvider";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import { MenuItemLink } from "@/ui/MenuItemLink";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import _ from "lodash";
import { deleteItem } from "../actions";
import { DeleteForever } from "@mui/icons-material";
import { usePathname } from "next/navigation";
import { useTable } from "./QueryTableProvider";
// export const minimumColWidth = 120;

const ColumnHeaderSortOptions: React.FC<{
  index: number;
}> = ({ index }) => {
  const { columns, query } = useTable();
  const column = columns[index];
  const isOrderedColumn = query.sort_by === column.key;
  const path = usePathname();
  if (isOrderedColumn) {
    const sortOrder = isOrderedColumn ? query.sort_order : null;
    const toggleOption = sortOrder === "asc" ? "desc" : "asc";
    return (
      <Box>
        <NextLink
          href={`${path}?sort_by=${column.key}&sort_order=${toggleOption}`}
        >
          <IconButton size="sm" color="neutral" sx={{ opacity: 0.9 }}>
            {sortOrder === "desc" ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
          </IconButton>
        </NextLink>
      </Box>
    );
  }
  return (
    <Box className={isOrderedColumn ? "" : "sort-options"}>
      <NextLink
        href={`${path}?sort_by=${column.key}&sort_order=${
          !isOrderedColumn
            ? "asc"
            : query.sort_order === "desc"
            ? "asc"
            : "desc"
        }`}
      >
        <IconButton size="sm" color="neutral" sx={{ opacity: 0.5 }}>
          <ArrowUpwardIcon />
        </IconButton>
      </NextLink>
    </Box>
  );
};

const ColumnHeaderMoreOptions: React.FC<{
  index: number;
}> = ({ index }) => {
  const { columns } = useTable();
  const column = columns[index];
  const [isOpen, setIsOpen] = useState(false);
  const path = usePathname();
  return (
    <Box className={!isOpen ? "hover-option" : ""}>
      <Dropdown onOpenChange={(_, v) => setIsOpen(v)}>
        <MenuButton
          slots={{ root: IconButton }}
          slotProps={{
            root: {
              variant: "plain",
              color: "neutral",
              size: "sm",
              sx: { opacity: 0.5 },
            },
          }}
        >
          <MoreVertIcon />
        </MenuButton>
        <Menu placement="bottom-end" sx={{ width: 250 }}>
          <MenuItemLink href={`${path}?sort_by=${column.key}&sort_order=asc`}>
            <ListItemDecorator>
              <ArrowUpwardIcon />
            </ListItemDecorator>
            Sort by ASC
          </MenuItemLink>
          <MenuItemLink href={`${path}?sort_by=${column.key}&sort_order=desc`}>
            <ListItemDecorator>
              <ArrowDownwardIcon />
            </ListItemDecorator>
            Sort by DESC
          </MenuItemLink>
          <ListDivider />
          <MenuItem>
            <ListItemDecorator>
              <ViewColumnIcon />
            </ListItemDecorator>
            Manage columns
          </MenuItem>
          <MenuItem
            onClick={() => {
              // deleteItem(column.key);
              alert("not implemented");
            }}
          >
            <ListItemDecorator>
              <DeleteForever />
            </ListItemDecorator>
            Hide column
          </MenuItem>
        </Menu>
      </Dropdown>
    </Box>
  );
};

export const QueryTableHeaderCell: React.FC<{ index: number }> = ({ index }) => {
  const { columns } = useTable();
  const column = columns[index];
  return (
    <Box
      flex={1}
      display={"flex"}
      overflow={"hidden"}
      sx={{
        backgroundColor: "white",
        borderBottom: "1px solid #e0e0e0",
        "&:hover .react-resizable-handle-e": {
          borderLeft: "3px solid red !important",
        },
        "& .hover-option": {
          width: 0,
          margin: 0,
          opacity: 0,
          transition: "all 0.2s ease",
        },
        "&:hover .hover-option": {
          opacity: 1,
          margin: 1,
          width: 30,
        },
        "& .sort-options": {
          width: 0,
          // margin: 0,
          opacity: 0,
          transition: "opacity 0.0s ease",
        },
        "&:hover .sort-options": {
          opacity: 1,
          margin: 1,
          width: 30,
        },
      }}
      alignItems={"center"}
    >
      <Box
        overflow={"hidden"}
        ml={2}
        sx={{ cursor: "move" }}
        className="column-drag-handle"
      >
        <Typography
          textOverflow={"ellipsis"}
          noWrap
          level="title-sm"
          fontSize={14}
        >
          {column.label}
        </Typography>
      </Box>
      <Box flex={1} className="column-drag-handle"></Box>
      {<ColumnHeaderSortOptions index={index} />}
      {<ColumnHeaderMoreOptions index={index} />}
      <Box width={"8px"}></Box>
    </Box>
  );
};
