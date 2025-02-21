import React, { useState } from "react";
import Select, { SelectOption } from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import icons from "../../../../../ui/Icons";
import { Box, List, ListDivider, ListItem, Typography } from "@mui/joy";
import _ from "lodash";

// Get an array of icon names
const iconNames = Object.keys(icons);

// Hard-coded Material Design color palette
const materialColors = [
  { name: "Black", hex: "#000000" },
  { name: "Red", hex: "#f44336" },
  // { name: "Pink", hex: "#e91e63" },
  // { name: "Purple", hex: "#9c27b0" },
  { name: "Deep Purple", hex: "#673ab7" },
  // { name: "Indigo", hex: "#3f51b5" },
  // { name: "Blue", hex: "#2196f3" },
  { name: "Light Blue", hex: "#03a9f4" },
  // { name: "Cyan", hex: "#00bcd4" },
  // { name: "Teal", hex: "#009688" },
  { name: "Green", hex: "#4caf50" },
  // { name: "Light Green", hex: "#8bc34a" },
  // { name: "Lime", hex: "#cddc39" },
  // { name: "Yellow", hex: "#ddeb3b" },
  // { name: "Amber", hex: "#ffc107" },
  { name: "Orange", hex: "#ff9800" },
  // { name: "Deep Orange", hex: "#ff5722" },
  // { name: "Brown", hex: "#795548" },
  // { name: "Grey", hex: "#9e9e9e" },
  { name: "Blue Grey", hex: "#607d8b" },
];

const renderValue = (option: SelectOption<string> | null) => {
  if (!option || !option.id) {
    return null;
  }

  const { color, icon } = deserializeOption(option.value);

  const Icon = icons[icon as keyof typeof icons].icon;

  return (
    <span
      ref={option.ref}
      style={{ display: "flex", alignItems: "center", gap: 8 }}
    >
      {<Icon sx={{ color, fontSize: 28 }} />}
      {/* {option.label} */}
    </span>
  );
};

const serializeOption = (args: {
  icon: string | null;
  color: string | null;
}) => {
  return `${args.icon}||${args.color}`;
};
const deserializeOption = (
  value: string
): {
  icon: string | null;
  color: string | null;
} => {
  const [icon, color] = value.split("||");
  return { icon, color };
};

export default function IconSelector({
  value: { color, icon },
  onChange,
}: {
  value: { icon: string | null; color: string | null };
  onChange: (args: { icon: string | null; color: string | null }) => void;
}) {
  return (
    <Select
      value={serializeOption({ color, icon })}
      onChange={(event, newValue) =>
        newValue && onChange(deserializeOption(newValue))
      }
      sx={{ width: 80 }}
      renderValue={renderValue}
    >
      {Object.entries(_.groupBy(icons, (d) => d.category)).map(
        ([catName, animalss], index) => {
          const iconNames = Object.entries(icons)
            .filter(([_, icon]) => icon.category === catName)
            .map(([k]) => k);

          return (
            <List
              key={catName}
              aria-labelledby={`select-group-${catName}`}
              sx={{ "--ListItemDecorator-size": "28px" }}
            >
              <ListItem id={`select-group-${catName}`} sticky>
                <Typography level="body-xs" sx={{ textTransform: "uppercase" }}>
                  {catName} ({animalss.length})
                </Typography>
              </ListItem>

              {iconNames.map((name) => {
                const Icon = icons[name as keyof typeof icons].icon;

                return (
                  <Box display={"flex"} key={name}>
                    {materialColors.map((c) => (
                      <Option
                        key={name + c.hex}
                        value={serializeOption({ icon: name, color: c.hex })}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {<Icon sx={{ color: c.hex, fontSize: 28 }} />}
                        </span>
                      </Option>
                    ))}
                  </Box>
                );
              })}
            </List>
          );
        }
      )}
    </Select>
  );
}
