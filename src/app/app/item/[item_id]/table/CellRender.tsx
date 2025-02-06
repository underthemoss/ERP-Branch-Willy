"use client";
import {
  Avatar,
  Box,
  CircularProgress,
  Input,
  Link,
  Tooltip,
  Typography,
} from "@mui/joy";
import {
  ColumnType,
  LookupConfig,
} from "../../../../../../prisma/generated/mongo";
import { HTMLInputTypeAttribute, useState } from "react";
import { LazyUserDetail } from "@/ui/LazyUserDetails";
import { UserPicker } from "@/ui/picker/UserPicker";
import { LookupPicker } from "@/ui/picker/LookupPicker";
import { useItem } from "../ItemProvider";
import { Point } from "wkx";

export const CellRender = (props: {
  type: ColumnType;
  value: string | undefined | null;
  readonly: boolean;
  onBlur: (value: string | undefined | null) => Promise<void>;
  colIndex: number;
  rowIndex: number;
  totalColumns: number;
  columnLookupConfig: LookupConfig | null;
}) => {
  const { updateRowValue, item } = useItem();
  const item_id = item.rows[props.rowIndex]?.id;
  const tabIndex = props.readonly
    ? -1
    : props.colIndex + props.totalColumns * props.rowIndex + 1;
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const commit = async (value: string | null | undefined) => {
    setIsSaving(true);
    // await props.onBlur(value?.trim());
    if (item_id) {
      await updateRowValue({
        item_id: item_id,
        column_Key: item.column_config[props.colIndex].key,
        value: value?.trim() || null,
      });
    }
    setIsSaving(false);
  };

  const handleName = (col: number, row: number) =>
    props.readonly ? `cell-${col}-${row}-readonly` : `cell-${col}-${row}`;

  const setFocus = (col: number, row: number) => {
    const target = handleName(col, row);
    const el = document.querySelector<HTMLInputElement>(`#${target}`);
    if (el) {
      el.focus();
    } else {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  };

  const handleKeyboardNavigation = (code: string) => {
    if (code.startsWith("Key") || code.startsWith("Digit")) {
      setIsEditing(true);
    }
    switch (code) {
      case "ArrowLeft": {
        setFocus(props.colIndex - 1, props.rowIndex);
        break;
      }
      case "ArrowRight": {
        setFocus(props.colIndex + 1, props.rowIndex);
        break;
      }
      case "ArrowUp": {
        setFocus(props.colIndex, props.rowIndex - 1);
        break;
      }
      case "ArrowDown": {
        setFocus(props.colIndex, props.rowIndex + 1);
        break;
      }
      case "Enter":
        setIsEditing(true);
        break;
      case "Escape":
        setIsEditing(false);
        break;
    }
  };

  const SimpleEditInput = ({
    type,
    defaultValue,
  }: {
    type: HTMLInputTypeAttribute;
    defaultValue: string | undefined | null;
  }) => {
    return (
      <Input
        autoFocus={!isSaving}
        type={type}
        onBlur={async (e) => {
          if (isEditing) {
            await commit(e.target.value);
            setIsEditing(false);
          }
        }}
        endDecorator={isSaving && <CircularProgress size="sm" />}
        onKeyDown={async (e) => {
          switch (e.code) {
            case "Escape":
              setIsEditing(false);
              break;
            case "ArrowLeft":
            case "ArrowRight":
            case "ArrowUp":
            case "ArrowDown":
              e.stopPropagation();
              break;

            case "Enter": {
              handleKeyboardNavigation("ArrowDown");
              break;
            }
            case "Tab": {
              e.preventDefault();
              e.stopPropagation();
              handleKeyboardNavigation("ArrowRight");
              break;
            }
          }
        }}
        style={{
          backgroundColor: !isEditing ? "white" : undefined,
          height: "100%",
          width: "100%",
          // padding: 16,
          borderRadius: 0,
        }}
        slotProps={{
          input: { style: {} },
        }}
        variant={isEditing ? "soft" : "plain"}
        defaultValue={defaultValue || undefined}
      />
    );
  };

  return (
    <Box
      tabIndex={tabIndex}
      onKeyDown={(e) => handleKeyboardNavigation(e.code)}
      id={handleName(props.colIndex, props.rowIndex)}
      onDoubleClick={() => setIsEditing(!isEditing)}
      style={{ padding: 0, borderBottom: "1px solid #e0e0e0" }}
      flex={1}
      display={"flex"}
      height={"100%"}
    >
      {props.type === "user" &&
        props.value &&
        (props.readonly ? (
          <LazyUserDetail userId={props.value} />
        ) : (
          <UserPicker
            value={props.value}
            onChange={async (val) => {
              await commit(val);
            }}
          />
        ))}
      {props.type === "lookup" && props.columnLookupConfig?.id && (
        <LookupPicker
          onChange={async (val) => {
            await commit(val);
          }}
          columns={props.columnLookupConfig.display_column_ids}
          parentId={props.columnLookupConfig?.id}
          value={props.value}
        />
      )}
      {props.type === "location" && (
        <Box>
          {(() => {
            if (!props.value) return;
            const point = props.value as unknown as [number, number];
            const [lng, lat] = point;
            const url = `https://www.google.com/maps/place/${lat},${lng}`;
            return (
              <Box>
                <Link href={url} target="_blank">
                  {lng}, {lat}
                </Link>
              </Box>
            );
          })()}
        </Box>
      )}
      {isEditing && !props.readonly ? (
        <>
          {props.type === "single_line_of_text" && (
            <SimpleEditInput type="text" defaultValue={props.value} />
          )}
          {props.type === "date" && (
            <SimpleEditInput type="date" defaultValue={props.value} />
          )}
          {props.type === "email" && (
            <SimpleEditInput type="email" defaultValue={props.value} />
          )}
          {props.type === "integer" && (
            <SimpleEditInput type="number" defaultValue={props.value} />
          )}
          {props.type === "img_url" && (
            <SimpleEditInput type="text" defaultValue={props.value} />
          )}
        </>
      ) : (
        <Box
          pl={1}
          flex={1}
          height={"100%"}
          alignItems={"center"}
          alignContent={"center"}
          overflow={"hidden"}
          onClick={() => setFocus(props.colIndex, props.rowIndex)}
        >
          <Typography noWrap>
            {props.type === "single_line_of_text" && props.value}
            {props.type === "email" && props.value}
          </Typography>
          {props.type === "img_url" &&
            props.value &&
            props.value.startsWith("http") && (
              <Tooltip
                placement="right"
                title={<img alt={props.type} src={props.value} />}
              >
                <Avatar sx={{ position: "unset" }} src={props.value} />
              </Tooltip>
            )}
          {props.type === "integer" && props.value}
          {/* {props.type === "user" && props.value && (
            <LazyUserDetail userId={props.value} />
          )} */}
          {props.type === "date" &&
            (props.value
              ? new Date(props.value).toLocaleString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "-")}
        </Box>
      )}
    </Box>
  );
};
