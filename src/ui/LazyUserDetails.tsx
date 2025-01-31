"use client";

import { useEffect, useState } from "react";
import { GenericEntityDetails } from "./GenericEntityDetails";
import { getUserBatch } from "./LazyUserDetails.actions";
import DataLoader from "dataloader";
import { memoize } from "lodash";
import { Box } from "@mui/joy";

const userLoader = new DataLoader<
  number,
  Awaited<ReturnType<typeof getUserBatch>>[number]
>((keys) => getUserBatch(keys as number[]), {
  batchScheduleFn: (res) => setTimeout(res, 100),
  maxBatchSize: 1000,
});

export const LazyUserDetail = (props: {
  userId: string | number;
  nameOnly?: boolean;
}) => {
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (props.userId && Number.isInteger(Number(props.userId))) {
      userLoader.load(Number(props.userId)).then((d) => {
        if (d) {
          setLabel(`${d.first_name} ${d.last_name}`);
        }
      });
    }
  }, [props.userId]);

  return (
    <Box height={36}>
      {label && (
        <GenericEntityDetails id={props.userId} label={label} secondary={""} />
      )}
    </Box>
  );
};
