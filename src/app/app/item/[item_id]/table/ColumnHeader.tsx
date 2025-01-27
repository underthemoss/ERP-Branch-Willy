"use client";
import { Box, CircularProgress } from "@mui/joy";
import { useEffect, useRef, useState } from "react";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import { ColumnType } from "../../../../../../prisma/generated/mongo";
import PersonIcon from "@mui/icons-material/Person";

import { NextLink } from "@/ui/NextLink";
import { changeColumnWidth, moveHeader } from "../actions";
export const ColumnHeader = (props: {
  label: string;
  index: number;
  width?: number | null;
  type: ColumnType;
  objectId: string;
  lookupId?: string;
}) => {
  const ref = useRef<HTMLTableCellElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const minimumColWidth = 50;
  const defaultColWidth = 250;
  return (
    <Box
      ref={ref}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", props.index.toString());
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={async (e) => {
        const sourceColId = Number(e.dataTransfer.getData("text/plain"));
        const destinationId = props.index;
        setIsSaving(true);
        await moveHeader(props.objectId, sourceColId, destinationId);
        setIsSaving(false);
      }}
      style={{
        padding: 0,
        width: props.width || defaultColWidth,
        // borderRight: "1px solid #DEDEDE",
        backgroundColor: "#fbfcfe",
        borderRight: "1px solid rgb(222, 222, 222)",
      }}
    >
      <Box
        display={"flex"}
        height={"100%"}
        onDragOver={(e) => e.preventDefault()}
        alignItems={"center"}
        // overflow={"hidden"}
      >
        <Box pt={1} pl={1}>
          {props.type === "lookup" && (
            <NextLink href={`/app/item/${props.lookupId}`}>
              <SyncAltIcon fontSize="small" />
            </NextLink>
          )}
          {props.type === "user" && <PersonIcon fontSize="small" />}
        </Box>
        <Box
          alignContent={"center"}
          ml={1}
          textOverflow={"ellipsis"}
          width={300}
          whiteSpace={"nowrap"}
          overflow={"hidden"}
        >
          {props.label}
        </Box>
        <Box flex={1}></Box>
        {isSaving && (
          <Box alignContent={"center"}>
            <CircularProgress size="sm"></CircularProgress>
          </Box>
        )}
        <Box
          className="resize-handle"
          style={{ height: "100%" }}
          draggable
          onDrag={(e) => {
            if (ref.current) {
              const { left } = ref.current.getBoundingClientRect();
              const newWidth = e.clientX - left;
              if (newWidth > minimumColWidth) {
                ref.current.style.width = `${newWidth}px`;
              }
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
          }}
          onDragEnd={async () => {
            if (ref.current) {
              const { width } = ref.current.getBoundingClientRect();
              await changeColumnWidth(props.objectId, width);
            }
          }}
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "none";
            event.dataTransfer.dropEffect = "none";
          }}
          width={8}
          sx={{
            cursor: "ew-resize",
            opacity: 0,
            // backgroundColor: "red",
            // position:'fixed',
            // right: 0
          }}
        ></Box>
      </Box>
    </Box>
  );
};
