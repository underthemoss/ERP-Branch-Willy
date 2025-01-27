"use client";
import { useEffect, useState } from "react";
import { GenericPicker } from "./GenericPicker";
import { bulkLoadItems, searchItems } from "./LookupPicker.actions";
import DataLoader from "dataloader";
import { Box, Card, Tooltip } from "@mui/joy";

const itemLoader = new DataLoader<
  string,
  Awaited<ReturnType<typeof bulkLoadItems>>[number]
>((keys) => bulkLoadItems(keys as string[]), {
  batchScheduleFn: (res) => setTimeout(res, 100),
  maxBatchSize: 1000,
});

const LookupPickerItem = (props: { id: string }) => {
  const [label, setLabel] = useState("");
  const [data, setData] = useState<any>({});
  useEffect(() => {
    if (props.id) {
      itemLoader.load(props.id).then((d) => {
        if (d) {
          setLabel(`${(d.data as any).name}`);
          setData(d);
        }
      });
    }
  }, [props.id]);

  return (
    <Tooltip
      placement="left"
      arrow
      enterDelay={500}
      title={<pre>{JSON.stringify(data, undefined, 2)}</pre>}
    >
      <Box display={"flex"}>{label}</Box>
    </Tooltip>
  );
};

export const LookupPicker = (props: {
  parentId: string;
  value: string;
  onChange: (value: string) => Promise<void>;
}) => {
  return (
    <GenericPicker
      value={props.value}
      onChange={props.onChange}
      search={(term) => searchItems(props.parentId, term)}
      itemRenderer={(id) => <LookupPickerItem id={id} />}
    />
  );
};
