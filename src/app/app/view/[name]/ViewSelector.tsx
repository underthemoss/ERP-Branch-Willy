"use client";
import * as React from "react";
import AspectRatio from "@mui/joy/AspectRatio";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Divider from "@mui/joy/Divider";
import Sheet from "@mui/joy/Sheet";
import IconButton from "@mui/joy/IconButton";
import ToggleButtonGroup from "@mui/joy/ToggleButtonGroup";
import SvgIcon from "@mui/joy/SvgIcon";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import FormatAlignJustifyIcon from "@mui/icons-material/FormatAlignJustify";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";

import ListIcon from "@mui/icons-material/List";
import ViewKanbanIcon from "@mui/icons-material/ViewKanban";
import MapIcon from "@mui/icons-material/Map";
import { encodeUniversalQuery, UniversalQuery } from "@/lib/UniversalQuery";
import { usePathname, useRouter } from "next/navigation";

export default function ToggleGroupToolbar(props: { query: UniversalQuery }) {
  const { push } = useRouter();
  const path = usePathname();
  const active = Object.entries(props.query.components || {})
    .filter((d) => d[1] === true)
    .map((d) => d[0]);

  return (
    <Sheet
      variant="outlined"
      sx={{ borderRadius: "md", display: "inline-flex", gap: 2, p: 0.5, mr: 1 }}
    >
      <ToggleButtonGroup
        variant="plain"
        spacing={0.5}
        value={active}
        onChange={(event, components) => {
          const url = encodeUniversalQuery({
            ...props.query,
            components: {
              ...Object.fromEntries(components.map((k) => [k, true])),
            },
          });
          push(`${path}?${url}`);
        }}
        aria-label="text formatting"
      >
        <IconButton value="list" aria-label="list">
          <ListIcon />
        </IconButton>
        <IconButton value="kanban" aria-label="kanban">
          <ViewKanbanIcon />
        </IconButton>
        <IconButton value="map" aria-label="map">
          <MapIcon />
        </IconButton>
      </ToggleButtonGroup>
    </Sheet>
  );
}
