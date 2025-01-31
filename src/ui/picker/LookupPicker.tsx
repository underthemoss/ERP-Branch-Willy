"use client";
import { useEffect, useState } from "react";
import { GenericPicker } from "./GenericPicker";
import { bulkLoadItems, searchItems } from "./LookupPicker.actions";
import DataLoader from "dataloader";
import { Box, Tooltip } from "@mui/joy";

const itemLoader = new DataLoader<
  string,
  Awaited<ReturnType<typeof bulkLoadItems>>[number]
>((keys) => bulkLoadItems(keys as string[]), {
  batchScheduleFn: (res) => setTimeout(res, 10),
  maxBatchSize: 1000,
});

const LookupPickerItem = (props: { id: string }) => {
  const [label, setLabel] = useState("");
  const [data, setData] =
    useState<Awaited<ReturnType<typeof bulkLoadItems>>[number]>();
  useEffect(() => {
    if (props.id) {
      itemLoader.load(props.id).then((d) => {
        if (d) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      <Box
        display={"flex"}
        sx={{ cursor: "pointer" }}
        alignContent={"center"}
        alignItems={"center"}
      >
        {label}
      </Box>
    </Tooltip>
  );
};

export const LookupPicker = (props: {
  parentId: string;
  value: string | null | undefined;
  onChange: (value: string | null | undefined) => Promise<void>;
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
