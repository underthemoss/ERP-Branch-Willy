"use client";
import {
  Avatar,
  Box,
  CircularProgress,
  Input,
  Option,
  Select,
  Tooltip,
} from "@mui/joy";
import { ColumnType } from "../../../../../../prisma/generated/mongo";
import { UserDetail } from "@/ui/UserDetail";
import { HTMLInputTypeAttribute, useState } from "react";
import { LazyUserDetail } from "@/ui/LazyUserDetails";
import { GenericPicker } from "@/ui/picker/GenericPicker";
import { UserPicker } from "@/ui/picker/UserPicker";
import { LookupPicker } from "@/ui/picker/LookupPicker";

export const CellRender = (props: {
  type: ColumnType;
  value: string;
  readonly: boolean;  
  onBlur: (value: string) => Promise<void>;
  colIndex: number;
  rowIndex: number;
  totalColumns: number;
  columnData: any;
}) => {
  const tabIndex = props.readonly
    ? -1
    : props.colIndex + props.totalColumns * props.rowIndex + 1;
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [optomisticValue, setOptomisticValue] = useState(props.value || "");

  const commit = async (value: string) => {
    const isDirty = value !== optomisticValue;
    if (isDirty) {
      setIsSaving(true);
      setOptomisticValue(value.trim());
      await props.onBlur(value.trim());
      setIsSaving(false);
    }
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
    defaultValue: any;
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
        defaultValue={defaultValue}
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
            <SimpleEditInput type="text" defaultValue={optomisticValue} />
          )}
          {props.type === "date" && (
            <SimpleEditInput type="date" defaultValue={optomisticValue} />
          )}
          {props.type === "integer" && (
            <SimpleEditInput type="number" defaultValue={optomisticValue} />
          )}
          {props.type === "img_url" && (
            <SimpleEditInput type="text" defaultValue={optomisticValue} />
          )}
        </>
      ) : (
        <Box
          pl={1}
          flex={1}
          height={"100%"}
          onClick={() => setFocus(props.colIndex, props.rowIndex)}
        >
          {props.type === "single_line_of_text" && optomisticValue}
          {props.type === "img_url" && (
            <Tooltip placement="right" title={<img src={optomisticValue} />}>
              <Avatar sx={{ position: "unset" }} src={optomisticValue} />
            </Tooltip>
          )}
          {props.type === "integer" && optomisticValue}
          {/* {props.type === "user" && optomisticValue && (
            <LazyUserDetail userId={optomisticValue} />
          )} */}
          {props.type === "date" &&
            (optomisticValue
              ? new Date(optomisticValue).toLocaleString("en-US", {
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
