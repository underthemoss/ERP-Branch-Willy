import * as React from "react";
import Select, { SelectOption } from "@mui/joy/Select";
import Option from "@mui/joy/Option";

// Import Material UI icons
import TextFieldsIcon from "@mui/icons-material/TextFields";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SearchIcon from "@mui/icons-material/Search";
import ImageIcon from "@mui/icons-material/Image";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EmailIcon from "@mui/icons-material/Email";
import {
  ContentTypeAttributeType,
  ContentTypeConfigFieldType,
} from "../../../../../../prisma/generated/mongo";

export const ContentTypeAttributeDataTypeOptions: {
  value: ContentTypeConfigFieldType;
  label: string;
  icon: React.ReactElement;
}[] = [
  {
    value: "text",
    label: "Single Line of Text",
    icon: <TextFieldsIcon fontSize="small" />,
  },
  {
    value: "number",
    label: "Integer",
    icon: <FormatListNumberedIcon fontSize="small" />,
  },
  {
    value: "date",
    label: "Date",
    icon: <CalendarTodayIcon fontSize="small" />,
  },
  {
    value: "relation",
    label: "Relation",
    icon: <SearchIcon fontSize="small" />,
  },
  // {
  //   value: "iage",
  //   label: "Image URL",
  //   icon: <ImageIcon fontSize="small" />,
  // },
  {
    value: "location" as any,
    label: "Location",
    icon: <LocationOnIcon fontSize="small" />,
  },
  {
    value: "email",
    label: "Email",
    icon: <EmailIcon fontSize="small" />,
  },
];

export default function AttributeDataTypeSelect(props: {
  value: ContentTypeConfigFieldType;
  onChange: (value: ContentTypeConfigFieldType) => void;
}) {
  return (
    <Select
      placeholder="Select type"
      value={props.value}
      required
      onChange={(event, newValue) =>
        props.onChange(newValue as ContentTypeConfigFieldType)
      }
      // Optionally, customize the startDecorator to show the icon in the selected value.
      startDecorator={
        ContentTypeAttributeDataTypeOptions.find(
          (option) => option.value === props.value
        )?.icon || null
      }
    >
      {ContentTypeAttributeDataTypeOptions.map((option) => (
        <Option key={option.value} value={option.value}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {option.icon}
            {option.label}
          </span>
        </Option>
      ))}
    </Select>
  );
}
