"use client";
import { Avatar, Box, CircularProgress, Input, Tooltip } from "@mui/joy";
import { ColumnType } from "../../../../../../prisma/generated/mongo";
import { HTMLInputTypeAttribute, useState } from "react";
import { LazyUserDetail } from "@/ui/LazyUserDetails";
import { UserPicker } from "@/ui/picker/UserPicker";
import { LookupPicker } from "@/ui/picker/LookupPicker";
import { useItem } from "../ItemProvider";

export const CellRender = (props: {
  type: ColumnType;
  value: string | undefined | null;
  readonly: boolean;
  onBlur: (value: string | undefined | null) => Promise<void>;
  colIndex: number;
  rowIndex: number;
  totalColumns: number;
  columnData: { lookup: string };
}) => {
  const { updateItemValue, item } = useItem();
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
      await updateItemValue({
        item_id: item_id,
        columnIndex: props.colIndex,
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
      style={{ padding: 0 }}
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
      {props.type === "lookup" && (
        <LookupPicker
          onChange={async (val) => {
            await commit(val);
          }}
          parentId={props.columnData.lookup}
          value={props.value}
        />
      )}
      {isEditing && !props.readonly ? (
        <>
          {props.type === "single_line_of_text" && (
            <SimpleEditInput type="text" defaultValue={props.value} />
          )}
          {props.type === "date" && (
            <SimpleEditInput type="date" defaultValue={props.value} />
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
          onClick={() => setFocus(props.colIndex, props.rowIndex)}
        >
          {props.type === "single_line_of_text" && props.value}
          {props.type === "img_url" && props.value && (
            <Tooltip placement="right" title={<img src={props.value} />}>
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
