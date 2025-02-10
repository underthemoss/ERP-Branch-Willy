import { useEffect, useState } from "react";
import { getTreeNode } from "../actions";
import { Button, ListItemDecorator } from "@mui/joy";

import * as React from "react";
import Box from "@mui/joy/Box";
import Chip from "@mui/joy/Chip";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import Typography from "@mui/joy/Typography";

type Children = Awaited<ReturnType<typeof getTreeNode>>;
export type LookupValue =
  | Awaited<ReturnType<typeof getTreeNode>>[number]
  | null;

const Options: React.FC<{
  id: string | null;
  label: string;
  value: LookupValue;
  depth?: number;
}> = ({ id, label, depth = 0, value }) => {
  const isRoot = id === null;
  const [children, setChildren] = useState<Children>([]);
  const [expanded, setExpanded] = useState(isRoot);
  useEffect(() => {
    if (expanded) {
      getTreeNode(id).then(setChildren);
    }
  }, [expanded, id]);

  return [
    !isRoot && (
      <Option
        key={id}
        value={value}
        label={label} // The appearance of the selected value will be a string
        style={{ paddingLeft: 8 * depth }}
      >
        <ListItemDecorator>
          <Button
            size="sm"
            variant="plain"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? "-" : "+"}
          </Button>
        </ListItemDecorator>

        <Box component="span" sx={{ display: "block" }}>
          <Typography component="span" level="title-sm">
            {label}
          </Typography>
          <Typography level="body-xs">{"test"}</Typography>
        </Box>
        <Chip
          size="sm"
          variant="outlined"
          color={"primary"}
          sx={{
            ml: "auto",
            borderRadius: "2px",
            minHeight: "20px",
            paddingInline: "4px",
            fontSize: "xs",
            bgcolor: `${"var(--colors-role)"}.softBg`,
          }}
          style={{ "--colors-role": "primary" } as any}
        >
          qwe
        </Chip>
      </Option>
    ),
    ...(expanded
      ? children?.map((c) => {
          return (
            <Options
              key={c.id}
              id={c.id}
              label={(c.data as any).name}
              depth={depth + 1}
              value={c}
            />
          );
        })
      : []),
  ];
};

export const TreeViewSelect: React.FC<{
  onChange: (lookupId: LookupValue) => void;
}> = ({ onChange }) => {
  return (
    <Select
      slotProps={{
        listbox: {
          sx: {
            "--ListItemDecorator-size": "48px",
          },
        },
      }}
      onChange={(_, lookupId) => onChange(lookupId as LookupValue)}
      sx={{ minWidth: 240 }}
    >
      <Options id={null} label="Root" value={null} />
    </Select>
  );
};
