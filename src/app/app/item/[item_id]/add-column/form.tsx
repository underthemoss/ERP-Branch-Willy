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
import { ColumnType, Entity } from "../../../../../../prisma/generated/mongo";
import { useState } from "react";
import ColumnTypes from "./ColumnTypeSelector";
import { NextLinkBack } from "@/ui/NextLink";
import { LookupValue, TreeViewSelect } from "./TreeView";
import LookupColumnSelector from "./LookupColumnSelector";
import { RollupConfig } from "./RollupConfig";

export const ColumnForm: React.FC<{ item: Entity }> = ({ item }) => {
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
            <Box p={3} display={"flex"} flexDirection={"column"} gap={2}>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                autoComplete="off"
                name="name"
                placeholder="Label"
                required
              />
              {type === "lookup" && <TreeViewSelect onChange={setLookup} />}
              {type === "rollup" && (
                <Box display={"flex"} flexDirection={"column"} gap={1}>
                  <RollupConfig />
                  {item.column_config.map((c) => (
                    <Checkbox
                      name={`rollup-col-${c.key}`}
                      key={c.key}
                      label={c.label}
                      variant="soft"
                    />
                  ))}
                </Box>
              )}
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
