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

import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";
import { TableFooter } from "./TableFooter";
import { Tiles } from "./Tiles";
import AutoSizer from "react-virtualized-auto-sizer";

export const ItemTable = () => {
  const { item, loadMore } = useItem();

  const rowHeight = 50;

  return (
    <AutoSizer>
      {({ height, width }) => {
        return <Tiles height={height} width={width} />;
      }}
    </AutoSizer>
  );
};
