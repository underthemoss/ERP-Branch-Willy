"use client";
import { useEffect, useState } from "react";
import { GenericPicker } from "./GenericPicker";
import { bulkLoadItems, searchItems } from "./LookupPicker.actions";
import DataLoader from "dataloader";
import { Avatar, Box, Card, Divider, Tooltip } from "@mui/joy";
import LookupPickerTooltipContents from "./LookupPickerTooltip";
import { EntityCardToolTip } from "../entity-card/EntityCard";

const itemLoader = new DataLoader<
  string,
  Awaited<ReturnType<typeof bulkLoadItems>>[number]
>((keys) => bulkLoadItems(keys as string[]), {
  batchScheduleFn: (res) => setTimeout(res, 10),
  maxBatchSize: 1000,
});

const LookupPickerItem = (props: { id: string; columns: string[] }) => {
  const [data, setData] =
    useState<Awaited<ReturnType<typeof bulkLoadItems>>[number]>();
  useEffect(() => {
    if (props.id) {
      itemLoader.load(props.id).then((d) => {
        if (d) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setData(d);
        }
      });
    }
  }, [props.id]);

  return (
    <EntityCardToolTip item_id={props.id} placement="left">
      <Box
        display={"flex"}
        sx={{ cursor: "pointer" }}
        alignContent={"center"}
        alignItems={"center"}
      >
        {data?.parent?.column_config
          .filter((c) => props.columns.includes(c.key))
          .map((col) => {
            const value = ((data?.data as any) || {})[col.key];
            return (
              <Box
                key={col.key}
                flex={1}
                sx={{
                  width: 150,
                  borderBottom: "1px solid #e0e0e0",
                  height: 50,
                  overflow: "hidden",
                  alignContent: "center",
                  alignItems: "center",
                }}
              >
                {col.type === "img_url" && <Avatar src={value} />}
                {col.type === "integer" && value}
                {col.type === "single_line_of_text" && value}
              </Box>
            );
          })}
      </Box>
    </EntityCardToolTip>
  );
};

export const LookupPicker = (props: {
  parentId: string;
  value: string | null | undefined;
  columns: string[];
  onChange: (value: string | null | undefined) => Promise<void>;
}) => {
  return (
    <GenericPicker
      value={props.value}
      onChange={props.onChange}
      search={(term) => searchItems(props.parentId, term)}
      itemRenderer={(id) => (
        <LookupPickerItem id={id} columns={props.columns} />
      )}
    />
  );
};
