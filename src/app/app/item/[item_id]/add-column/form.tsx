"use client";
import {
  Box,
  Button,
  Checkbox,
  Input,
  Option,
  Select,
  Table,
  Typography,
} from "@mui/joy";
import { ColumnType } from "../../../../../../prisma/generated/mongo";
import { useState } from "react";
import ColumnTypes from "./ColumnTypeSelector";
import { NextLinkBack } from "@/ui/NextLink";
import { LookupValue, TreeViewSelect } from "./TreeView";
import LookupColumnSelector from "./LookupColumnSelector";

export const ColumnForm = () => {
  const [type, setType] = useState<ColumnType | null | string>(null);
  const [label, setLabel] = useState<string>("");
  const [lookup, setLookup] = useState<LookupValue>(null);

  return (
    <>
      <input name="type" type="hidden" value={type?.toString()} required />
      <input
        name="lookup"
        type="hidden"
        value={lookup?.id?.toString()}
        required
      />
      <Box>
        <Box display={"flex"} gap={1}>
          <Box>
            <ColumnTypes value={type as ColumnType} onChange={setType} />
          </Box>
          {type && (
            <Box p={3}>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                autoComplete="off"
                name="name"
                placeholder="Label"
                required
              />
              {type === "lookup" && <TreeViewSelect onChange={setLookup} />}
              {lookup && (
                <Box display={"flex"} flexDirection={"column"} gap={1}>
                  {lookup.column_config.map((c) => (
                    <Checkbox
                      name={`lookup-display-col-${c.key}`}
                      key={c.key}
                      label={c.label}
                      variant="soft"
                    />
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Box>
        <Box>
          <Box display={"flex"} gap={1}>
            <Box flex={1}></Box>
            <NextLinkBack>
              <Button variant="outlined">Cancel</Button>
            </NextLinkBack>
            <Button type="submit">Submit</Button>
          </Box>
        </Box>
      </Box>
    </>
  );
};
